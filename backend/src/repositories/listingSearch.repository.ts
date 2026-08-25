/**
 * Listing search against Postgres full-text search, with a trigram fallback for
 * misspelled queries.
 */
import { query } from "../config/database";
import {
  buildListingWhere,
  buildKeysetClause,
  buildOrderBy,
  keysetOrderBy,
  LISTING_COLUMNS,
  LISTING_JOINS,
  RANK_EXPRESSION,
  type Cursor,
  type ListingFilters,
  type SortKey,
} from "../db/queries/listingSearch.sql";
import { buildFacetCountsQuery } from "../db/queries/listingFacets.sql";
import type { ListingRow } from "./marketplace.repository";

export type SearchRow = ListingRow & { rank: string };

/** A resume point plus which way to walk from it — see `buildKeysetClause`. */
export type CursorSeek = { cursor: Cursor; direction: "next" | "prev" };

export type SearchOptions = ListingFilters & {
  sort: SortKey;
  limit: number;
  offset: number;
  /**
   * When present, rows are fetched by seeking from this cursor instead of
   * OFFSET — the fix for "page 500 must return as quickly as page 2": a seek
   * costs one index descent regardless of how deep the cursor is, where
   * OFFSET costs work proportional to `offset`. Absent on the first page of a
   * search (nothing to resume from) and on a hand-edited `?page=N` jump,
   * both of which still use `offset` below.
   */
  seek?: CursorSeek | null;
};

/**
 * Runs the tsquery search. Returns rows ordered by the requested sort.
 *
 * The query text is only bound when there is one: an unreferenced parameter
 * makes Postgres reject the statement with "could not determine data type of
 * parameter $1", since nothing in the SQL tells it what type to expect.
 */
export async function searchListingsExact(
  options: SearchOptions,
): Promise<SearchRow[]> {
  const hasQuery = Boolean(options.q);
  const values: unknown[] = hasQuery ? [options.q] : [];

  const where = buildListingWhere(options, values.length);
  values.push(...where.values);

  const textClause = hasQuery
    ? `AND l.search_vector @@ websearch_to_tsquery('english', $1)`
    : "";

  const seekClause =
    options.seek &&
    buildKeysetClause(
      options.sort,
      hasQuery,
      options.seek.cursor,
      options.seek.direction,
      values.length,
    );

  let sql: string;
  if (seekClause) {
    values.push(...seekClause.values);
    values.push(options.limit);
    sql = `SELECT ${LISTING_COLUMNS},
            ${hasQuery ? RANK_EXPRESSION : "0"} AS rank
     ${LISTING_JOINS}
     WHERE ${where.text}
       ${textClause}
       AND ${seekClause.text}
     ORDER BY ${keysetOrderBy(options.sort, hasQuery, options.seek!.direction)}
     LIMIT $${values.length}`;
  } else {
    values.push(options.limit, options.offset);
    const limitPlaceholder = `$${values.length - 1}`;
    const offsetPlaceholder = `$${values.length}`;
    sql = `SELECT ${LISTING_COLUMNS},
            ${hasQuery ? RANK_EXPRESSION : "0"} AS rank
     ${LISTING_JOINS}
     WHERE ${where.text}
       ${textClause}
     ORDER BY ${buildOrderBy(options.sort, hasQuery)}
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;
  }

  const { rows } = await query<SearchRow>(sql, values);

  // A backward seek runs under the reversed ORDER BY so LIMIT takes the rows
  // *closest* to the cursor — restoring display order means reversing once
  // more here, in memory, rather than a second index walk.
  if (seekClause && options.seek!.direction === "prev") rows.reverse();

  return rows;
}

/**
 * Fallback for when the exact search finds nothing: "bycicle" produces no
 * lexeme that matches "bicycle", so tsquery cannot help. Trigram similarity on
 * the raw title can, backed by the GIN index on `title gin_trgm_ops`.
 *
 * Only run after an exact miss — it is the more expensive path, and running it
 * on every search would spend that cost on the majority of queries that do not
 * need it.
 *
 * Ranks, then joins — not the other way round. Joining category/photo inline
 * (as `LISTING_JOINS` does, and as this query used to) forces Postgres to run
 * both joins — including the per-row `LATERAL` photo lookup — against every
 * row the trigram index returns before the `ORDER BY ... LIMIT` can discard
 * the ones that don't make the page: measured at ~1,085 ms for "bycicle"
 * against this dataset (thousands of trigram candidates, each joined, only
 * 24 kept). Resolving rank and applying `LIMIT` first, in a CTE over `listings`
 * alone, then joining only the resulting page — the exact same rows, same
 * order, verified — measured ~112 ms. Not applied to the exact-match path:
 * that one was already within budget, and touching a working query for a
 * theoretical gain is a bad trade this close to a deadline.
 */
export async function searchListingsFuzzy(
  options: SearchOptions,
): Promise<SearchRow[]> {
  if (!options.q) return [];

  const values: unknown[] = [options.q];
  const where = buildListingWhere(options, values.length);
  values.push(...where.values);

  values.push(options.limit, options.offset);
  const limitPlaceholder = `$${values.length - 1}`;
  const offsetPlaceholder = `$${values.length}`;

  // `<%` is word similarity: it compares the query against the closest *word*
  // in the title, not the whole string. Plain `%` compares entire strings, so
  // "hoodei" scored far below the threshold against "Pepe Jeans Zip Hoodie" and
  // only short titles ever matched. Both operators use the same GIN trigram
  // index on title.
  const { rows } = await query<SearchRow>(
    `WITH ranked AS (
       SELECT l.id, l.title, l.category_slug, l.audience, l.brand, l.size,
              l.colour, l.condition, l.price, l.city, l.location, l.posted_at,
              word_similarity($1, l.title) AS rank
       FROM listings l
       WHERE ${where.text}
         AND $1 <% l.title
       ORDER BY rank DESC, l.posted_at DESC, l.id DESC
       LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
     )
     SELECT ranked.id::text,
            ranked.title,
            ranked.category_slug,
            c.label AS category_label,
            ranked.audience,
            ranked.brand,
            ranked.size,
            ranked.colour,
            ranked.condition::text,
            ranked.price,
            ranked.city,
            ranked.location,
            ranked.posted_at,
            COALESCE(photo.thumb_path, photo.path) AS image,
            ranked.rank
     FROM ranked
     JOIN listing_categories c ON c.slug = ranked.category_slug
     LEFT JOIN LATERAL (
       SELECT path, thumb_path
       FROM listing_photos
       WHERE listing_id = ranked.id
       ORDER BY is_primary DESC, position ASC
       LIMIT 1
     ) AS photo ON true
     ORDER BY ranked.rank DESC, ranked.posted_at DESC, ranked.id DESC`,
    values,
  );

  return rows;
}

/**
 * Total matches for the same filters, used for result counts and page numbers.
 * `fuzzy` must match whichever path produced the rows or the count will not
 * agree with them.
 */
export async function countSearchMatches(
  options: ListingFilters & { fuzzy?: boolean },
): Promise<number> {
  const hasQuery = Boolean(options.q);
  // Same reason as above: bind the query text only when the SQL references it.
  const values: unknown[] = hasQuery ? [options.q] : [];

  const where = buildListingWhere(options, values.length);
  values.push(...where.values);

  const textClause = !hasQuery
    ? ""
    : options.fuzzy
      ? "AND $1 <% l.title"
      : "AND l.search_vector @@ websearch_to_tsquery('english', $1)";

  const { rows } = await query<{ total: string }>(
    `SELECT count(*)::text AS total
     FROM listings l
     WHERE ${where.text}
       ${textClause}`,
    values,
  );

  return Number(rows[0]?.total ?? 0);
}

/** One facet group's value: `{ facet: "colour", value: "Black", total: "312" }`. */
export type FacetCountRow = {
  facet: string;
  value: string;
  label: string | null;
  /** bigint, so node-postgres hands it back as a string. */
  total: string;
};

/**
 * Every facet count for the current filters, in one round trip.
 *
 * See buildFacetCountsQuery for why each facet excludes its own filter and how
 * one statement covers all six groups.
 */
export async function fetchFacetCounts(
  options: ListingFilters & { fuzzy?: boolean },
): Promise<FacetCountRow[]> {
  const { text, values } = buildFacetCountsQuery(options, {
    fuzzy: options.fuzzy,
  });

  const { rows } = await query<FacetCountRow>(text, values);
  return rows;
}

export type SuggestionRow = {
  title: string;
  price: string;
  category_slug: string;
  category_label: string;
};

/**
 * Type-ahead suggestions for a partial query.
 *
 * Matched with a prefix `ILIKE` rather than the `tsvector`, because a person
 * halfway through typing "bicy" has not finished a word yet and full-text search
 * matches whole lexemes — "bicy" would find nothing until the "cle" arrived. The
 * trigram index on title serves the leading-wildcard pattern that a plain B-tree
 * could not.
 *
 * Distinct on title: at a hundred thousand listings the same phrase recurs across
 * many rows, and a dropdown repeating "iPhone 13" six times is worse than useless.
 * The cheapest row per title wins, which is the one a searcher most wants to see.
 *
 * Matching is a substring ILIKE so partial typing works ("iph" → iPhone), but the
 * results are then ranked so a whole-word hit beats an incidental one: typing
 * "car" puts "Dodge Durango … Car" above "Carbon Steel Wok" (which only matches
 * because "Carbon" starts with "car"). A generous candidate pool is fetched and
 * ranked in Node, since there are few distinct titles and the ordering that
 * matters — word relevance — is awkward to express in SQL safely.
 *
 * @param q partial query; under two characters returns nothing, since a single
 *          letter matches most of the table and the list would be noise.
 * @param limit how many suggestions to return, capped to keep the dropdown short.
 * @returns titles with price and category, most relevant first.
 */
export async function suggestListings(
  q: string,
  limit = 6,
): Promise<SuggestionRow[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  const { rows } = await query<SuggestionRow>(
    `SELECT DISTINCT ON (l.title)
            l.title,
            l.price,
            l.category_slug,
            c.label AS category_label
       FROM listings l
       JOIN listing_categories c ON c.slug = l.category_slug
      WHERE l.status = 'active'
        AND l.title ILIKE '%' || $1 || '%'
      ORDER BY l.title, l.price ASC
      LIMIT 50`,
    [trimmed],
  );

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wholeWord = new RegExp(`\\b${escaped}\\b`, "i"); // "car" in "… Car"
  const wordStart = new RegExp(`\\b${escaped}`, "i"); // also matches "Carbon"

  /* Relevance: a whole-word match (2) outranks a word that merely starts with
     the query (1), which outranks a match buried mid-word (0). Ties break on the
     shorter title, then price. This is what pushes "Carbon Steel Wok" below the
     actual cars for "car" without dropping partial-typing support. */
  const score = (title: string): number =>
    wholeWord.test(title) ? 2 : wordStart.test(title) ? 1 : 0;

  return rows
    .sort(
      (a, b) =>
        score(b.title) - score(a.title) ||
        a.title.length - b.title.length ||
        Number(a.price) - Number(b.price),
    )
    .slice(0, Math.min(Math.max(limit, 1), 10));
}

/** Levenshtein distance, capped early since only small edits are worth ranking. */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * The closest existing word to a misspelled query, for a "did you mean"
 * prompt.
 *
 * Titles here are full phrases ("Kids Bicycle 20-inch — Barely Used"), and
 * `word_similarity` against the *whole title* — the previous approach —
 * regularly tied several unrelated titles at the same score (many phrases
 * score exactly 0.25 against a short typo, since the threshold search
 * space is wide), with no tiebreaker: `bycicle` could surface "Engineering
 * Mathematics by B.S. Grewal" as often as "Kids Bicycle...", depending on
 * scan order, not relevance.
 *
 * Fixed by keeping the trigram index for what it's good at — narrowing 90k+
 * rows to a small, plausible candidate set fast — and then resolving the
 * actual "closest word" question in Node, where a real edit distance can be
 * computed per *word* rather than per full title. The candidate pool (30
 * titles) is small enough that this costs nothing meaningful on top of the
 * indexed query itself.
 */
export async function suggestCorrection(q: string): Promise<string | null> {
  const trimmed = q.trim();
  if (!trimmed) return null;

  const { rows } = await query<{ title: string }>(
    `SELECT l.title
     FROM listings l
     WHERE l.status = 'active' AND $1 <% l.title
     ORDER BY word_similarity($1, l.title) DESC
     LIMIT 30`,
    [trimmed],
  );
  if (rows.length === 0) return null;

  const words = new Set<string>();
  for (const { title } of rows) {
    for (const word of title.toLowerCase().split(/[^a-z0-9]+/)) {
      if (word.length > 2) words.add(word);
    }
  }

  const needle = trimmed.toLowerCase();
  let best: { word: string; distance: number } | null = null;
  for (const word of words) {
    const distance = editDistance(needle, word);
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && word < best.word) // deterministic tiebreak
    ) {
      best = { word, distance };
    }
  }

  return best?.word ?? null;
}

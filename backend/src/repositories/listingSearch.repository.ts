/**
 * Listing search against Postgres full-text search, with a trigram fallback for
 * misspelled queries.
 */
import { query } from "../config/database";
import {
  buildListingWhere,
  buildOrderBy,
  LISTING_COLUMNS,
  LISTING_JOINS,
  RANK_EXPRESSION,
  type ListingFilters,
  type SortKey,
} from "../db/queries/listingSearch.sql";
import type { ListingRow } from "./marketplace.repository";

export type SearchRow = ListingRow & { rank: string };

export type SearchOptions = ListingFilters & {
  sort: SortKey;
  limit: number;
  offset: number;
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

  values.push(options.limit, options.offset);
  const limitPlaceholder = `$${values.length - 1}`;
  const offsetPlaceholder = `$${values.length}`;

  const { rows } = await query<SearchRow>(
    `SELECT ${LISTING_COLUMNS},
            ${hasQuery ? RANK_EXPRESSION : "0"} AS rank
     ${LISTING_JOINS}
     WHERE ${where.text}
       ${textClause}
     ORDER BY ${buildOrderBy(options.sort, hasQuery)}
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values,
  );

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
    `SELECT ${LISTING_COLUMNS},
            word_similarity($1, l.title) AS rank
     ${LISTING_JOINS}
     WHERE ${where.text}
       AND $1 <% l.title
     ORDER BY rank DESC, l.posted_at DESC, l.id DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
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

/**
 * The closest existing title to a misspelled query, for a "did you mean"
 * prompt. Limited to active rows and ordered by similarity.
 */
export async function suggestCorrection(q: string): Promise<string | null> {
  if (!q) return null;

  const { rows } = await query<{ title: string }>(
    `SELECT l.title
     FROM listings l
     WHERE l.status = 'active' AND $1 <% l.title
     ORDER BY word_similarity($1, l.title) DESC
     LIMIT 1`,
    [q],
  );

  return rows[0]?.title ?? null;
}

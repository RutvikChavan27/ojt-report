/**
 * This file builds SQL query text as strings — but never by pasting user
 * input directly into that text. Every filter turns into a `$1`, `$2`, ...
 * placeholder, and the actual value travels alongside in a separate `values`
 * array; the database driver combines them safely later. This is what
 * "parameterized SQL" means in practice, and it's the reason this app is safe
 * from SQL injection even though the search box builds a query dynamically
 * from whatever filters are selected.
 *
 * This is also where "filtering" happens for the whole search feature:
 * `buildListingWhere` below turns the selected filters (category, price
 * range, condition, city, ...) into one SQL `WHERE` clause, all applied
 * together in the database — never by fetching everything and filtering it
 * in JavaScript afterwards, which would not scale to 100,000+ listings.
 *
 * SQL construction for listing search.
 *
 * Every filter value is passed as a bind parameter — nothing is interpolated
 * into the string. The search box is the most obvious injection vector in the
 * app and the brief says it will be tested as one, so the only thing this module
 * ever concatenates is fragments it authored itself.
 */

/** Sorts the API accepts. `relevance` is only meaningful with a query. */
export type SortKey = "relevance" | "newest" | "price_asc" | "price_desc";

export type ListingFilters = {
  q?: string;
  categorySlug?: string;
  /** Narrows within categorySlug — e.g. "mens-fashion--mens-shirts". */
  subcategorySlug?: string;
  audience?: string;
  city?: string;
  /** Empty means "any condition". */
  conditions?: string[];
  /** Empty means "any size". */
  sizes?: string[];
  /** Empty means "any colour". */
  colours?: string[];
  minPrice?: number;
  maxPrice?: number;
  /** "Posted within" in days. */
  postedWithinDays?: number;
};

/** A fragment plus the values its placeholders refer to. */
export type SqlFragment = { text: string; values: unknown[] };

/**
 * Builds the shared WHERE clause. Each filter is independent and skipped when
 * absent, which is what lets the UI clear one without disturbing the others.
 *
 * `startIndex` is the number of parameters already bound by the caller, so
 * placeholder numbering continues rather than restarting at $1.
 */
export function buildListingWhere(
  filters: ListingFilters,
  startIndex = 0,
): SqlFragment {
  const clauses: string[] = ["l.status = 'active'"];
  const values: unknown[] = [];
  const next = () => `$${startIndex + values.length}`;

  if (filters.categorySlug) {
    values.push(filters.categorySlug);
    clauses.push(`l.category_slug = ${next()}`);
  }

  if (filters.subcategorySlug) {
    values.push(filters.subcategorySlug);
    clauses.push(`l.subcategory_slug = ${next()}`);
  }

  if (filters.audience) {
    values.push(filters.audience);
    clauses.push(`l.audience = ${next()}::listing_audience`);
  }

  if (filters.city) {
    values.push(filters.city);
    clauses.push(`l.city = ${next()}`);
  }

  // = ANY(array) rather than IN (...), so one placeholder covers any number of
  // selected conditions and the statement text stays stable for the planner.
  if (filters.conditions && filters.conditions.length > 0) {
    values.push(filters.conditions);
    clauses.push(`l.condition = ANY(${next()}::listing_condition[])`);
  }

  if (filters.sizes && filters.sizes.length > 0) {
    values.push(filters.sizes);
    clauses.push(`l.size = ANY(${next()}::text[])`);
  }

  if (filters.colours && filters.colours.length > 0) {
    values.push(filters.colours);
    clauses.push(`l.colour = ANY(${next()}::text[])`);
  }

  if (filters.minPrice !== undefined) {
    values.push(filters.minPrice);
    clauses.push(`l.price >= ${next()}`);
  }

  if (filters.maxPrice !== undefined) {
    values.push(filters.maxPrice);
    clauses.push(`l.price <= ${next()}`);
  }

  if (filters.postedWithinDays !== undefined) {
    values.push(filters.postedWithinDays);
    clauses.push(`l.posted_at >= now() - (${next()} || ' days')::interval`);
  }

  return { text: clauses.join("\n       AND "), values };
}

/**
 * ORDER BY for a sort key. Every option ends in a unique column so the order is
 * total: without that tiebreaker, rows with equal price or timestamp could swap
 * places between requests and a keyset cursor would skip or repeat them.
 */
export function buildOrderBy(sort: SortKey, hasQuery: boolean): string {
  switch (sort) {
    case "price_asc":
      return "l.price ASC, l.id ASC";
    case "price_desc":
      return "l.price DESC, l.id DESC";
    case "newest":
      return "l.posted_at DESC, l.id DESC";
    case "relevance":
    default:
      // Ranking is meaningless without a query, so fall back to newest.
      return hasQuery
        ? "rank DESC, l.posted_at DESC, l.id DESC"
        : "l.posted_at DESC, l.id DESC";
  }
}

/**
 * The rank expression. Weights come from the generated tsvector: title is 'A'
 * and description 'B', so a title hit outranks the same word in a description.
 * Selected as a constant 0 when there is no query, keeping one column list for
 * both paths.
 */
export const RANK_EXPRESSION = `ts_rank(l.search_vector, websearch_to_tsquery('english', $1))`;

/**
 * PAGINATION, explained: a simple way to paginate is `LIMIT 24 OFFSET 480`
 * ("skip the first 480 rows, then give me 24") for page 21. The problem: to
 * skip 480 rows, Postgres still has to walk through all of them first — so
 * page 500 gets slower and slower the deeper it goes, at 100,000+ rows.
 *
 * This app uses a "cursor" (also called "keyset pagination") for Next/Previous
 * instead: rather than saying "skip 480 rows," it remembers the sort values
 * of the *last row already shown* — e.g. "the last listing was posted at
 * 2pm and has id 4821" — and asks Postgres for "the next rows after that
 * point," which an index can jump straight to, regardless of how deep into
 * the results that is. `Cursor` below is exactly that remembered position.
 *
 * The tiebreaker values of one row, in the order its sort's ORDER BY uses them.
 * Enough to resume immediately after (or before) that row without OFFSET.
 *
 * `id` is always present — every sort ends on it, which is what keeps a keyset
 * seek unambiguous even when every other column ties. `rank` and `price` are
 * mutually exclusive with each other and with being absent, one per sort family.
 */
export type Cursor = {
  rank?: number;
  postedAt?: string;
  price?: number;
  id: string;
};

// The cursor is sent to the browser as part of the API response (as
// "nextCursor"/"prevCursor") and comes back on the next request — so it has
// to travel as plain text in a URL. JSON.stringify turns the Cursor object
// into text, and base64url encoding turns that text into a URL-safe string
// with no spaces or special characters. It isn't encryption — anyone could
// decode it — but nothing about a cursor is secret; it just remembers a
// position in an already-public list of listings.
/** Opaque to the client on purpose — nothing but this module parses it. */
export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

/** `null` on anything malformed, so a tampered or stale cursor degrades to "start over" rather than a 500. */
export function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as Cursor).id === "string"
    ) {
      return parsed as Cursor;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Reads the cursor tuple off a result row, in the shape its sort produced it.
 * The mirror of `buildKeysetClause` below — same three sort families.
 */
export function cursorFromRow(
  row: { id: string; posted_at: Date; price: string },
  sort: SortKey,
  hasQuery: boolean,
  rank?: number,
): Cursor {
  if (sort === "price_asc" || sort === "price_desc") {
    return { price: Number(row.price), id: row.id };
  }
  if (sort === "relevance" && hasQuery) {
    return { rank, postedAt: row.posted_at.toISOString(), id: row.id };
  }
  return { postedAt: row.posted_at.toISOString(), id: row.id };
}

/**
 * A keyset ("seek") WHERE fragment: the set of rows immediately after (or
 * before) one already-seen row, expressed as a single row-constructor
 * comparison so Postgres can satisfy it with the same composite index that
 * already backs the ORDER BY — no OFFSET, so the cost does not grow with how
 * deep into the result set that row was.
 *
 * `direction: "next"` walks the same way the sort already reads (the next
 * page). `"prev"` walks backward: the comparison and the ORDER BY it must be
 * paired with (see `keysetOrderBy`) are both reversed, so the *closest*
 * preceding rows come back first under LIMIT — the repository then reverses
 * the array once in memory to restore display order. Two round trips through
 * the same index, never a scan proportional to position.
 */
export function buildKeysetClause(
  sort: SortKey,
  hasQuery: boolean,
  cursor: Cursor,
  direction: "next" | "prev",
  startIndex: number,
): SqlFragment | null {
  const forward = direction === "next";

  if (sort === "price_asc" || sort === "price_desc") {
    if (cursor.price === undefined) return null;
    const op = (sort === "price_asc") === forward ? ">" : "<";
    return {
      text: `(l.price, l.id) ${op} ($${startIndex + 1}::numeric, $${startIndex + 2}::bigint)`,
      values: [cursor.price, cursor.id],
    };
  }

  if (sort === "relevance" && hasQuery) {
    if (cursor.rank === undefined || cursor.postedAt === undefined) return null;
    const op = forward ? "<" : ">";
    return {
      text: `(${RANK_EXPRESSION}, l.posted_at, l.id) ${op} ($${startIndex + 1}::double precision, $${startIndex + 2}::timestamptz, $${startIndex + 3}::bigint)`,
      values: [cursor.rank, cursor.postedAt, cursor.id],
    };
  }

  // "newest", and "relevance" without a query (which sorts the same way).
  if (cursor.postedAt === undefined) return null;
  const op = forward ? "<" : ">";
  return {
    text: `(l.posted_at, l.id) ${op} ($${startIndex + 1}::timestamptz, $${startIndex + 2}::bigint)`,
    values: [cursor.postedAt, cursor.id],
  };
}

/**
 * The ORDER BY a keyset seek must run under: `buildOrderBy`'s own order when
 * walking forward, flipped end-to-end when walking backward. Pairs with
 * `buildKeysetClause`'s comparison flip — together they turn "the closest
 * rows before this one" into "the first rows LIMIT returns", which is what
 * makes a backward seek just as index-friendly as a forward one.
 */
export function keysetOrderBy(
  sort: SortKey,
  hasQuery: boolean,
  direction: "next" | "prev",
): string {
  const order = buildOrderBy(sort, hasQuery);
  if (direction === "next") return order;

  return order
    .split(", ")
    .map((column) => (column.endsWith(" DESC") ? column.replace(" DESC", " ASC") : column.replace(" ASC", " DESC")))
    .join(", ");
}

/** Columns every result row needs, including the primary photo. */
export const LISTING_COLUMNS = `
  l.id::text,
  l.title,
  l.category_slug,
  c.label AS category_label,
  l.audience,
  l.brand,
  l.size,
  l.colour,
  l.condition::text,
  l.price,
  l.city,
  l.location,
  l.posted_at,
  -- The thumbnail generated at upload time; falls back to the full-size
  -- photo for every row with none (every seeded row, and anything uploaded
  -- before thumbnails existed) — see upload.middleware.ts.
  COALESCE(photo.thumb_path, photo.path) AS image
`;

/**
 * Joins used by the exact search. The photo comes from a LATERAL subquery so
 * a page of results costs one query rather than one per row.
 */
export const LISTING_JOINS = `
  FROM listings l
  JOIN listing_categories c ON c.slug = l.category_slug
  LEFT JOIN LATERAL (
    SELECT path, thumb_path
    FROM listing_photos
    WHERE listing_id = l.id
    ORDER BY is_primary DESC, position ASC
    LIMIT 1
  ) AS photo ON true
`;

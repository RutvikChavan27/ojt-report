/**
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
  l.posted_at,
  photo.path AS image
`;

/**
 * Joins used by both the exact and fuzzy searches. The photo comes from a
 * LATERAL subquery so a page of results costs one query rather than one per row.
 */
export const LISTING_JOINS = `
  FROM listings l
  JOIN listing_categories c ON c.slug = l.category_slug
  LEFT JOIN LATERAL (
    SELECT path
    FROM listing_photos
    WHERE listing_id = l.id
    ORDER BY is_primary DESC, position ASC
    LIMIT 1
  ) AS photo ON true
`;

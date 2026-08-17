/**
 * SQL construction for facet counts — the "(n)" beside every filter checkbox.
 *
 * One statement produces every count. The alternative, a query per facet group,
 * costs six round trips and six scans of the same matching set to answer one
 * page load; the brief rules it out and so does the arithmetic.
 *
 * As with listingSearch.sql, nothing user-supplied is ever concatenated: only
 * fragments this module authored itself.
 */
import type { ListingFilters, SqlFragment } from "./listingSearch.sql";

/** The filters rendered as checkbox lists, so the ones that need counts. */
export const FACET_KEYS = [
  "category",
  "audience",
  "city",
  "condition",
  "size",
  "colour",
  "price",
] as const;

export type FacetKey = (typeof FACET_KEYS)[number];

/**
 * Price bands, bucketed into the ids the client already uses.
 *
 * These ids are the contract with PRICE_BANDS in the frontend search helpers —
 * renaming a band here means renaming it there.
 */
const PRICE_BAND_SQL = `CASE
      WHEN l.price < 5000 THEN '0-5000'
      WHEN l.price < 20000 THEN '5000-20000'
      WHEN l.price < 50000 THEN '20000-50000'
      ELSE '50000-'
    END`;

/** Where each facet's value comes from on the listings row. */
const FACET_COLUMN: Record<FacetKey, string> = {
  category: "l.category_slug",
  audience: "l.audience::text",
  city: "l.city",
  condition: "l.condition::text",
  size: "l.size",
  colour: "l.colour",
  price: PRICE_BAND_SQL,
};

/**
 * Builds the facet-count query.
 *
 * Each facet is counted with every filter applied **except its own**. That is
 * what makes a facet list usable: having picked colour "Black", the colour list
 * must still show how many Blue and Green items are available, or there is no
 * way to switch. Counting the fully-filtered set instead would show every other
 * colour as zero.
 *
 * The per-facet booleans (`keep_colour` and friends) are what allow this in a
 * single pass — each branch ANDs the other facets' flags and ignores its own,
 * rather than re-running the search six times with different WHERE clauses.
 *
 * `fuzzy` must match the path that produced the results, or the counts will
 * describe a different set of rows than the ones on screen.
 */
export function buildFacetCountsQuery(
  filters: ListingFilters,
  options: { fuzzy?: boolean } = {},
): SqlFragment {
  const values: unknown[] = [];
  const bind = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  /* Filters with no checkbox list of their own — a free-text query, a price
     range, a recency cut-off. Nothing shows counts for these, so they narrow
     the candidate set unconditionally. */
  const always: string[] = ["l.status = 'active'"];

  if (filters.q) {
    const q = bind(filters.q);
    always.push(
      options.fuzzy
        ? `${q} <% l.title`
        : `l.search_vector @@ websearch_to_tsquery('english', ${q})`,
    );
  }
  if (filters.postedWithinDays !== undefined) {
    always.push(
      `l.posted_at >= now() - (${bind(filters.postedWithinDays)} || ' days')::interval`,
    );
  }

  /* Each facet's own predicate. "true" when nothing is selected, which makes
     that facet's flag a no-op rather than a special case in every branch. */
  const own: Record<FacetKey, string> = {
    category: filters.categorySlug
      ? `l.category_slug = ${bind(filters.categorySlug)}`
      : "true",
    audience: filters.audience
      ? `l.audience = ${bind(filters.audience)}::listing_audience`
      : "true",
    city: filters.city ? `l.city = ${bind(filters.city)}` : "true",
    condition: filters.conditions?.length
      ? `l.condition = ANY(${bind(filters.conditions)}::listing_condition[])`
      : "true",
    size: filters.sizes?.length
      ? `l.size = ANY(${bind(filters.sizes)}::text[])`
      : "true",
    colour: filters.colours?.length
      ? `l.colour = ANY(${bind(filters.colours)}::text[])`
      : "true",
    /* Price is a facet like any other, so its range moved out of the
       unconditional filters and in here. Counted with the other filters but
       not its own, the remaining bands keep their counts after one is picked —
       narrowing unconditionally would show every other band as zero and leave
       no way to switch. */
    price: [
      filters.minPrice !== undefined
        ? `l.price >= ${bind(filters.minPrice)}`
        : null,
      filters.maxPrice !== undefined
        ? `l.price <= ${bind(filters.maxPrice)}`
        : null,
    ]
      .filter(Boolean)
      .join(" AND ") || "true",
  };

  const selectList = FACET_KEYS.flatMap((key) => [
    `${FACET_COLUMN[key]} AS ${key}_value`,
    `(${own[key]}) AS keep_${key}`,
  ]).join(",\n           ");

  /* Referenced once per facet, so Postgres materialises it: the table is
     scanned once and the six aggregations run over the stored result.

     Kept deliberately narrow — six values and six flags, no labels and no
     join. Every column here is paid for ~70k times, and once the row set
     outgrows work_mem the materialised CTE spills to temp files, which cost
     far more than the aggregation itself. Labels are attached at the end
     instead, against the few dozen rows that survive grouping. */
  const candidate = `candidate AS (
    SELECT ${selectList}
    FROM listings l
    WHERE ${always.join("\n      AND ")}
  )`;

  const branches = FACET_KEYS.map((key) => {
    const others = FACET_KEYS.filter((other) => other !== key).map(
      (other) => `keep_${other}`,
    );

    // size and colour are nullable; a NULL is "not stated", not a facet value.
    return `    SELECT '${key}' AS facet, ${key}_value AS value, count(*) AS total
    FROM candidate
    WHERE ${key}_value IS NOT NULL
      AND ${others.join("\n      AND ")}
    GROUP BY ${key}_value`;
  });

  return {
    // Ordered in SQL, on the numeric count rather than its text form: biggest
    // group first, then alphabetically, so the lists render deterministically.
    text: `WITH ${candidate},
  counted AS (
${branches.join("\n    UNION ALL\n")}
  )
  SELECT counted.facet,
         counted.value,
         c.label,
         counted.total
  FROM counted
  LEFT JOIN listing_categories c
    ON counted.facet = 'category' AND c.slug = counted.value
  ORDER BY counted.facet ASC, counted.total DESC, counted.value ASC`,
    values,
  };
}

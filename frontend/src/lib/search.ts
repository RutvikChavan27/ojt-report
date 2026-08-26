/**
 * The shared search-state contract: types every filter/sort/page value, and
 * the URL <-> `SearchParams` round trip that makes a search bookmarkable,
 * shareable and reload-safe (see `paramsFromSearch`/`searchToParams` below).
 *
 * Matching, filtering, sorting, ranking and paging themselves happen in
 * Postgres — see `searchApi.ts`, which calls the real API and reshapes its
 * response into `SearchResult` below. This module used to also contain a
 * fixture implementation of all of that over mock data; it's gone (the
 * results page has used the real API exclusively for some time), but
 * `SearchResult.items` still names the fixture's `Listing` type as a shape
 * contract rather than duplicating it.
 */
import { CATEGORIES, type Listing } from "../data/marketplace";

export type SortKey = "relevance" | "newest" | "price_asc" | "price_desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export const POSTED_WITHIN_OPTIONS: { days: number; label: string }[] = [
  { days: 1, label: "Today" },
  { days: 3, label: "Last 3 days" },
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
];

/** Price bands shown as a facet, since a range slider cannot carry counts. */
export const PRICE_BANDS: { id: string; label: string; min?: number; max?: number }[] =
  [
    { id: "0-5000", label: "Under ₹5,000", max: 5000 },
    { id: "5000-20000", label: "₹5,000 – ₹20,000", min: 5000, max: 20000 },
    { id: "20000-50000", label: "₹20,000 – ₹50,000", min: 20000, max: 50000 },
    { id: "50000-", label: "Above ₹50,000", min: 50000 },
  ];

/**
 * The condition values the backend actually returns (see `listing_condition`
 * in the schema and the facet response) — used to validate a condition
 * arriving from the URL.
 */
const REAL_CONDITIONS = ["New with tags", "Like new", "Good", "Fair"];

export type SearchParams = {
  q: string;
  category: string | null;
  city: string | null;
  conditions: string[];
  /** A PRICE_BANDS id, or null when the shopper typed their own range. */
  priceBand: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  postedWithinDays: number | null;
  sort: SortKey;
  page: number;
  /**
   * A resume point from a previous response's `nextCursor`/`prevCursor`, so
   * Next/Previous can seek by index instead of by OFFSET — see
   * `Pagination.tsx`. `null` for a first load, a filter/sort change, or a
   * jump to a page not adjacent to the one just shown.
   */
  cursor: string | null;
  cursorDir: "next" | "prev" | null;
};

export const EMPTY_PARAMS: SearchParams = {
  q: "",
  category: null,
  city: null,
  conditions: [],
  priceBand: null,
  minPrice: null,
  maxPrice: null,
  postedWithinDays: null,
  sort: "newest",
  page: 1,
  cursor: null,
  cursorDir: null,
};

export type FacetValue = { value: string; label: string; count: number };

export type Facets = {
  category: FacetValue[];
  city: FacetValue[];
  condition: FacetValue[];
  price: FacetValue[];
};

export type SearchResult = {
  items: Listing[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  facets: Facets;
  /** Closest real word to a query that matched nothing. */
  suggestion: string | null;
  /** Resume points for Next/Previous — see `SearchParams.cursor`. */
  nextCursor: string | null;
  prevCursor: string | null;
};

/* -------------------------------------------------------------------------- */
/* URL state                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Reads a search out of the query string.
 *
 * The URL is the single source of truth for a search, which is what makes a
 * result page bookmarkable, shareable and correct after a reload or a press of
 * the back button. Nothing about the current search is held anywhere else.
 */
export function paramsFromSearch(search: URLSearchParams): SearchParams {
  const number = (key: string): number | null => {
    const raw = search.get(key);
    if (raw === null || raw.trim() === "") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  const sortRaw = search.get("sort") as SortKey | null;
  const validSort = SORT_OPTIONS.some((option) => option.value === sortRaw);
  const q = search.get("q")?.trim() ?? "";

  return {
    q,
    category: search.get("category"),
    city: search.get("city"),
    // Repeated keys, so a value containing a comma survives the round trip.
    // Validated against REAL_CONDITIONS (the backend's actual enum values)
    // above, so a condition arriving from a link, a reload, or the filter
    // checkboxes themselves is never silently dropped.
    conditions: search
      .getAll("condition")
      .filter((value) => REAL_CONDITIONS.includes(value)),
    priceBand: search.get("price"),
    minPrice: number("minPrice"),
    maxPrice: number("maxPrice"),
    postedWithinDays: number("postedWithin"),
    sort: validSort && sortRaw ? sortRaw : q ? "relevance" : "newest",
    page: number("page") ?? 1,
    cursor: search.get("cursor"),
    cursorDir: search.get("cursorDir") === "prev" ? "prev" : search.get("cursorDir") === "next" ? "next" : null,
  };
}

/**
 * Writes a search into a query string.
 *
 * Defaults are omitted so a plain search produces a clean, shareable URL rather
 * than a wall of empty parameters.
 */
export function searchToParams(params: SearchParams): URLSearchParams {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.city) search.set("city", params.city);
  params.conditions.forEach((value) => search.append("condition", value));
  if (params.priceBand) search.set("price", params.priceBand);
  if (params.minPrice !== null) search.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== null) search.set("maxPrice", String(params.maxPrice));
  if (params.postedWithinDays !== null) {
    search.set("postedWithin", String(params.postedWithinDays));
  }

  const defaultSort = params.q ? "relevance" : "newest";
  if (params.sort !== defaultSort) search.set("sort", params.sort);
  if (params.page > 1) search.set("page", String(params.page));
  if (params.cursor && params.cursorDir) {
    search.set("cursor", params.cursor);
    search.set("cursorDir", params.cursorDir);
  }

  return search;
}

/** Human labels for the applied-filter chips, each with the key that clears it. */
export function describeFilters(
  params: SearchParams,
): { key: string; label: string }[] {
  const chips: { key: string; label: string }[] = [];

  if (params.category) {
    const label =
      CATEGORIES.find((entry) => entry.slug === params.category)?.label ??
      params.category;
    chips.push({ key: "category", label });
  }
  if (params.city) chips.push({ key: "city", label: params.city });
  params.conditions.forEach((value) =>
    chips.push({ key: `condition:${value}`, label: value }),
  );
  if (params.priceBand) {
    const label =
      PRICE_BANDS.find((entry) => entry.id === params.priceBand)?.label ??
      params.priceBand;
    chips.push({ key: "price", label });
  } else if (params.minPrice !== null || params.maxPrice !== null) {
    chips.push({
      key: "price",
      label: `₹${params.minPrice ?? 0} – ${
        params.maxPrice === null ? "any" : `₹${params.maxPrice}`
      }`,
    });
  }
  if (params.postedWithinDays !== null) {
    const label =
      POSTED_WITHIN_OPTIONS.find(
        (entry) => entry.days === params.postedWithinDays,
      )?.label ?? "Recent";
    chips.push({ key: "postedWithin", label });
  }

  return chips;
}

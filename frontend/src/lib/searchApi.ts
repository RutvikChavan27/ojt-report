/**
 * Bridges the search page to the backend search API.
 *
 * The page's own `SearchParams` (parsed from the URL) and `SearchResult` shape
 * stay exactly as they were, so every control, chip and breadcrumb keeps
 * working untouched. All this does is swap where the answer comes from:
 * previously `lib/search.ts` filtered a fixture array in the browser, now the
 * server does the matching, faceting, sorting and paging.
 */
import {
  searchListings as apiSearch,
  type ApiFacetValue,
  type ApiSearchResult,
} from "./api";
import { PRICE_BANDS, type SearchParams, type SearchResult } from "./search";

/**
 * The server's listings, in the shape the page's `SearchResult` declares.
 *
 * That type still names the fixture's `Listing`, which carries fields a results
 * grid never renders (description, all photos, the seller). Everything actually
 * used by a card is present on `ApiListing`, so this asserts across rather than
 * widening the fixture type — which is due for deletion once the last page is
 * migrated.
 */
type ResultItems = SearchResult["items"];

/** Server sort ids, keyed by the page's own sort values. */
const SORT_MAP: Record<string, string> = {
  newest: "newest",
  price_asc: "price_asc",
  price_desc: "price_desc",
  relevance: "relevance",
};

/** The band the shopper picked, or the range they typed. */
function priceRange(params: SearchParams): { min?: number; max?: number } {
  if (params.priceBand) {
    const band = PRICE_BANDS.find((entry) => entry.id === params.priceBand);
    if (band) return { min: band.min, max: band.max };
  }
  return {
    min: params.minPrice ?? undefined,
    max: params.maxPrice ?? undefined,
  };
}

const toFacet = (values: ApiFacetValue[]) =>
  values.map((entry) => ({
    value: entry.value,
    label: entry.label,
    count: entry.count,
  }));

/**
 * Price bands come back keyed by id, so the readable label is attached here.
 *
 * Every band is listed even at zero, and in the declared order rather than by
 * count: a price ladder that reorders itself as you filter is unreadable.
 */
function priceFacet(values: ApiFacetValue[]) {
  const counts = new Map(values.map((entry) => [entry.value, entry.count]));
  return PRICE_BANDS.map((band) => ({
    value: band.id,
    label: band.label,
    count: counts.get(band.id) ?? 0,
  }));
}

export async function searchListingsViaApi(
  params: SearchParams,
): Promise<SearchResult> {
  const { min, max } = priceRange(params);

  const result: ApiSearchResult = await apiSearch({
    q: params.q || undefined,
    category: params.category ?? undefined,
    city: params.city ?? undefined,
    condition: params.conditions.length ? params.conditions : undefined,
    minPrice: min,
    maxPrice: max,
    postedWithin: params.postedWithinDays ?? undefined,
    sort: SORT_MAP[params.sort] ?? params.sort,
    page: params.page,
    cursor: params.cursor ?? undefined,
    cursorDir: params.cursorDir ?? undefined,
  });

  return {
    items: result.items as unknown as ResultItems,
    total: result.total,
    page: result.page,
    perPage: result.perPage,
    pageCount: Math.max(Math.ceil(result.total / result.perPage), 1),
    suggestion: result.suggestion,
    nextCursor: result.nextCursor,
    prevCursor: result.prevCursor,
    facets: {
      category: toFacet(result.facets.category),
      city: toFacet(result.facets.city),
      condition: toFacet(result.facets.condition),
      price: priceFacet(result.facets.price),
    },
  };
}

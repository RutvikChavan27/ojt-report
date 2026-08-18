/**
 * Search orchestration: runs the exact search, falls back to fuzzy on a miss,
 * and shapes rows into the API's response.
 */
import {
  countSearchMatches,
  fetchFacetCounts,
  searchListingsExact,
  searchListingsFuzzy,
  suggestCorrection,
  suggestListings,
  type FacetCountRow,
} from "../repositories/listingSearch.repository";
import type { SortKey } from "../db/queries/listingSearch.sql";
import type { FacetKey } from "../db/queries/listingFacets.sql";
import { resolveImagePath } from "../utils/images";
import type {
  ListingDTO,
  ListingFacetsDTO,
  ListingSearchDTO,
} from "../types/dto";

const PLACEHOLDER_IMAGE = "/images/product-slim-fit-tee.jpg";

export type SearchRequest = {
  q?: string;
  categorySlug?: string;
  audience?: string;
  city?: string;
  conditions?: string[];
  sizes?: string[];
  colours?: string[];
  minPrice?: number;
  maxPrice?: number;
  postedWithinDays?: number;
  sort: SortKey;
  page: number;
  perPage: number;
};

/**
 * Folds the flat rows from the facet query into one array per group.
 *
 * Every group is present even when empty, so the UI can render a filter list
 * that is simply empty rather than having to guard against a missing key.
 */
function groupFacets(rows: FacetCountRow[]): ListingFacetsDTO {
  const grouped: ListingFacetsDTO = {
    category: [],
    audience: [],
    city: [],
    condition: [],
    size: [],
    colour: [],
    price: [],
  };

  for (const row of rows) {
    const group = grouped[row.facet as FacetKey];
    // Ignore anything the query grew that this version does not know about.
    if (!group) continue;

    group.push({
      value: row.value,
      label: row.label ?? row.value,
      count: Number(row.total),
    });
  }

  return grouped;
}

const toDTO = (row: {
  id: string;
  title: string;
  category_slug: string;
  category_label: string;
  audience: string;
  brand: string | null;
  size: string | null;
  colour: string | null;
  condition: string;
  price: string;
  city: string;
  location: string | null;
  posted_at: Date;
  image: string | null;
}): ListingDTO => ({
  id: row.id,
  title: row.title,
  category: row.category_slug,
  categoryLabel: row.category_label,
  audience: row.audience,
  brand: row.brand,
  size: row.size,
  colour: row.colour,
  condition: row.condition,
  price: Number(row.price),
  city: row.city,
  location: row.location,
  postedAt: row.posted_at.toISOString(),
  image: resolveImagePath(row.image ?? PLACEHOLDER_IMAGE),
});

/** A type-ahead suggestion, as the dropdown needs it. */
export type SuggestionDTO = {
  title: string;
  price: number;
  category: string;
  categoryLabel: string;
};

/**
 * Type-ahead suggestions for a partial query.
 *
 * Kept separate from `searchListings` rather than reusing it with a small
 * `perPage`: a search runs the count and every facet alongside the page of
 * results, and none of that is wanted for a dropdown that fires while someone is
 * still typing. This is one indexed query, so it stays cheap enough to run per
 * keystroke-after-debounce.
 */
export async function suggestSearches(
  q: string,
  limit?: number,
): Promise<SuggestionDTO[]> {
  const rows = await suggestListings(q, limit);

  return rows.map((row) => ({
    title: row.title,
    price: Number(row.price),
    category: row.category_slug,
    categoryLabel: row.category_label,
  }));
}

/**
 * One page of search results.
 *
 * Tries tsquery first. If a query was supplied and matched nothing, retries with
 * trigram similarity and flags the response as fuzzy, so the UI can say results
 * are approximate and offer a correction.
 */
export async function searchListings(
  request: SearchRequest,
): Promise<ListingSearchDTO> {
  const perPage = Math.min(Math.max(request.perPage, 1), 60);
  const page = Math.max(request.page, 1);
  const offset = (page - 1) * perPage;

  const options = { ...request, limit: perPage, offset };

  /* All three queries are dispatched together rather than the page first and the
     count/facets after it.

     They do not depend on each other — only on `fuzzy`, which is false for every
     search that matches something. So the count and facets are started
     optimistically on that assumption, and the endpoint costs one round trip
     instead of two. Over a link to the database that dominates: the queries
     themselves are milliseconds, the round trip is not.

     The bet is wrong only when a supplied query matches nothing, and the cost
     of losing it is two superseded queries whose results are dropped. Rare
     enough, and cheap enough, to be worth halving the latency of every search
     that does match. */
  const pageRows = searchListingsExact(options);
  const optimisticTotal = countSearchMatches({ ...request, fuzzy: false });
  const optimisticFacets = fetchFacetCounts({ ...request, fuzzy: false });

  let rows = await pageRows;
  let fuzzy = false;
  let suggestion: string | null = null;

  // Only reach for the fuzzy path on a genuine miss: a later page legitimately
  // comes back empty, and retrying there would silently mix the two rankings.
  if (rows.length === 0 && request.q && page === 1) {
    rows = await searchListingsFuzzy(options);
    if (rows.length > 0) {
      fuzzy = true;
      suggestion = await suggestCorrection(request.q);
    }
  }

  let total: number;
  let facetRows: FacetCountRow[];

  if (fuzzy) {
    // The optimistic pair counted the exact match set, which is empty here, so
    // they are re-run against the fuzzy one. Their rejections still need
    // claiming: an ignored rejected promise is an unhandled rejection, which
    // takes the process down under Node's default policy.
    void optimisticTotal.catch(() => undefined);
    void optimisticFacets.catch(() => undefined);

    [total, facetRows] = await Promise.all([
      countSearchMatches({ ...request, fuzzy: true }),
      fetchFacetCounts({ ...request, fuzzy: true }),
    ]);
  } else {
    [total, facetRows] = await Promise.all([optimisticTotal, optimisticFacets]);
  }

  return {
    items: rows.map(toDTO),
    total,
    page,
    perPage,
    hasMore: page * perPage < total,
    sort: request.sort,
    fuzzy,
    suggestion,
    facets: groupFacets(facetRows),
  };
}

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

  let rows = await searchListingsExact(options);
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

  // Independent of each other, so run them together rather than in sequence —
  // the endpoint's latency is then the slower of the two, not their sum.
  const [total, facetRows] = await Promise.all([
    countSearchMatches({ ...request, fuzzy }),
    fetchFacetCounts({ ...request, fuzzy }),
  ]);

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

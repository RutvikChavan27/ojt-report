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
  type CursorSeek,
  type FacetCountRow,
  type SearchRow,
} from "../repositories/listingSearch.repository";
import {
  cursorFromRow,
  decodeCursor,
  encodeCursor,
  type SortKey,
} from "../db/queries/listingSearch.sql";
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
  /** Opaque token from a previous response's `nextCursor`/`prevCursor`. */
  cursor?: string;
  cursorDir?: "next" | "prev";
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
 * This is the main search function — the controller calls this one function,
 * and it's responsible for producing everything a search results page needs
 * in one go: the page of listings, the total count (for "1,234 results" and
 * page numbers), the facet counts (the numbers next to each filter checkbox),
 * and — only when needed — a typo correction.
 *
 * In plain terms, what happens inside:
 *   1. Try an exact search (real words matching the listing's title/description).
 *   2. If that finds nothing at all AND the shopper typed something, try again
 *      with typo-tolerant matching instead (so "bycicle" still finds bicycles).
 *   3. Also work out the total count and the filter counts, in parallel with
 *      the above rather than after it, since none of them depend on each other.
 *   4. If someone asked for a page number that doesn't exist (e.g. page 50 of
 *      a 3-page result), quietly give them the last real page instead of an
 *      empty one.
 *   5. Package everything into the shape the frontend expects and return it.
 *
 * "One page of search results." Tries tsquery first (Postgres's real
 * full-text search). If a query was supplied and matched nothing, retries with
 * trigram similarity (typo-tolerant matching) and flags the response as fuzzy,
 * so the UI can say results are approximate and offer a correction.
 */
export async function searchListings(
  request: SearchRequest,
): Promise<ListingSearchDTO> {
  const perPage = Math.min(Math.max(request.perPage, 1), 60);
  const requestedPage = Math.max(request.page, 1);
  const offset = (requestedPage - 1) * perPage;

  /* A cursor is only trusted when it actually decodes and carries the fields
     this sort needs (see `buildKeysetClause`) — anything else, including one
     left over from a different sort after the shopper changed it, quietly
     falls back to `offset` below rather than 400ing or serving nonsense. */
  const seek: CursorSeek | null =
    request.cursor && request.cursorDir
      ? (() => {
          const cursor = decodeCursor(request.cursor!);
          return cursor ? { cursor, direction: request.cursorDir! } : null;
        })()
      : null;

  const options = { ...request, limit: perPage, offset, seek };

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
  let total: number;
  let facetRows: FacetCountRow[];

  // Only reach for the fuzzy path on a genuine miss: a later page legitimately
  // comes back empty, and retrying there would silently mix the two rankings.
  if (rows.length === 0 && request.q && requestedPage === 1) {
    /* Same bet as the exact-search fan-out above, one level deeper: the fuzzy
       page, its count, its facets and its "did you mean" all start together
       rather than the page first and the rest after it. Awaiting the page
       alone before starting the other three turned every fuzzy search into
       two sequential round trips instead of one — the fuzzy page itself
       costs as much as any of the other three, so that was doubling the
       floor, not adding a rounding error.

       The bet here is that the fuzzy page finds something, which is what
       "fuzzy" already meant before this change — a search this far in has
       already missed on tsquery, so a second miss (fuzzy also finding
       nothing) is rarer still, and its cost is the same three superseded
       queries the exact path already accepts losing. */
    const fuzzyRows = searchListingsFuzzy(options);
    const fuzzyTotal = countSearchMatches({ ...request, fuzzy: true });
    const fuzzyFacets = fetchFacetCounts({ ...request, fuzzy: true });
    const fuzzySuggestion = suggestCorrection(request.q);

    rows = await fuzzyRows;
    fuzzy = rows.length > 0;

    if (fuzzy) {
      void optimisticTotal.catch(() => undefined);
      void optimisticFacets.catch(() => undefined);
      [total, facetRows, suggestion] = await Promise.all([
        fuzzyTotal,
        fuzzyFacets,
        fuzzySuggestion,
      ]);
    } else {
      void fuzzyTotal.catch(() => undefined);
      void fuzzyFacets.catch(() => undefined);
      void fuzzySuggestion.catch(() => undefined);
      [total, facetRows] = await Promise.all([optimisticTotal, optimisticFacets]);
    }
  } else {
    [total, facetRows] = await Promise.all([optimisticTotal, optimisticFacets]);
  }

  // A page past the last real one — someone jumping straight to a high page
  // number, or a filter narrowing the results out from under an already-open
  // one — comes back with no rows even though matches exist. Re-fetch the
  // last real page instead of handing back a blank grid over a nonzero total.
  //
  // Only meaningful for an `offset` request: a cursor seek coming back empty
  // means "nothing more in that direction", which is what an already-disabled
  // Next/Previous button prevents the client from ever asking for on purpose.
  let page = requestedPage;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  if (!seek && rows.length === 0 && total > 0 && requestedPage > pageCount) {
    page = pageCount;
    rows = await searchListingsExact({ ...options, offset: (page - 1) * perPage });
  }

  const hasQuery = Boolean(request.q);
  const first = rows[0] as SearchRow | undefined;
  const last = rows[rows.length - 1] as SearchRow | undefined;
  const nextCursor = last
    ? encodeCursor(cursorFromRow(last, request.sort, hasQuery, Number(last.rank)))
    : null;
  const prevCursor = first
    ? encodeCursor(cursorFromRow(first, request.sort, hasQuery, Number(first.rank)))
    : null;

  return {
    items: rows.map(toDTO),
    total,
    page,
    perPage,
    hasMore: page * perPage < total,
    // No further page exists once the last row is on screen; a cursor is
    // only worth handing back when there is somewhere left for it to go.
    nextCursor: page * perPage < total ? nextCursor : null,
    prevCursor: page > 1 ? prevCursor : null,
    sort: request.sort,
    fuzzy,
    suggestion,
    facets: groupFacets(facetRows),
  };
}

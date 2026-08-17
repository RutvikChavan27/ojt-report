/** Shapes returned by the API (what the frontend consumes). */

/** A marketplace listing as it appears in a results grid. */
export type ListingDTO = {
  id: string;
  title: string;
  /** Category slug, e.g. "womens-dresses". */
  category: string;
  /** Human label for that slug, e.g. "Dresses". */
  categoryLabel: string;
  audience: string;
  brand: string | null;
  size: string | null;
  colour: string | null;
  condition: string;
  price: number;
  city: string;
  /**
   * Neighbourhood within `city`, or null when the listing has none recorded.
   * Seeded rows are city-level only, so this is null for all of them.
   */
  location: string | null;
  postedAt: string;
  /** Primary photo, already resolved to a servable path. */
  image: string;
};

/** Who a listing belongs to, as much of them as a buyer may see. */
export type ListingSellerDTO = {
  name: string;
  /** ISO timestamp of the account's creation, for "Member since". */
  memberSince: string;
  /**
   * Partly hidden contact number, or null when the seller has not given one.
   * The full number is never part of a response.
   */
  phoneMasked: string | null;
};

/** A listing on its own page: everything above plus body copy and all photos. */
export type ListingDetailDTO = ListingDTO & {
  description: string;
  images: string[];
  seller: ListingSellerDTO;
  viewCount: number;
  status: string;
};

/** One page of listings plus enough context to render paging controls. */
export type ListingPageDTO = {
  items: ListingDTO[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
};

/**
 * Everything the homepage needs, in one round trip.
 *
 * Bundled rather than left as three calls because the page cannot render
 * usefully without all of it, and three requests would give three separate
 * loading states for one screen.
 */
export type DashboardDTO = {
  /** Active listings site-wide, for the "N listings live" line. */
  totalActive: number;
  /** Newest active listings, for the "Fresh listings" grid. */
  recent: ListingDTO[];
  /** Every browsable category with its live count, for the tiles and links. */
  categories: ListingCategoryDTO[];
};

/** One stored photo, as returned by the upload endpoint. */
export type UploadedImageDTO = {
  /** Public path, ready to be saved on a listing and served back. */
  path: string;
};

/**
 * The signed-in user as the API reports them. No password hash and no provider
 * ids — the shape itself keeps those out of responses.
 */
export type AuthUserDTO = {
  id: number;
  email: string;
  name: string;
};

/** One selectable value in a filter list, with how many listings it would match. */
export type FacetValueDTO = {
  /** What to send back as the filter value. */
  value: string;
  /** What to show the shopper — equal to `value` unless a label exists. */
  label: string;
  count: number;
};

/**
 * Counts for every checkbox filter. Each group is counted with the other
 * filters applied but not its own, so the alternatives within a group stay
 * visible after one of them is picked.
 */
export type ListingFacetsDTO = {
  category: FacetValueDTO[];
  audience: FacetValueDTO[];
  city: FacetValueDTO[];
  condition: FacetValueDTO[];
  size: FacetValueDTO[];
  colour: FacetValueDTO[];
  /** Price bands, keyed by band id (e.g. "5000-20000"). */
  price: FacetValueDTO[];
};

/** A page of search results plus what the search did to produce them. */
export type ListingSearchDTO = {
  items: ListingDTO[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  sort: string;
  /** True when the exact search missed and trigram similarity was used instead. */
  fuzzy: boolean;
  /** Closest real title to a misspelled query, for "did you mean". */
  suggestion: string | null;
  facets: ListingFacetsDTO;
};

/** A browsable category with how many active listings it holds. */
export type ListingCategoryDTO = {
  slug: string;
  label: string;
  audience: string;
  total: number;
  image: string;
};

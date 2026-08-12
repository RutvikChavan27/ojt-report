/** Shapes returned by the API (what the frontend consumes). */

export type Gender = "Men" | "Women";

export type ProductDTO = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  /** Cover photo — always images[0]. Kept for callers that only need one thumbnail. */
  image: string;
  /** Every photo for this product, in display order. */
  images: string[];
  brand: string;
  color: string;
  variantCount?: number;
  sizes: string[];
  gender: Gender;
};

export type CategoryDTO = {
  label: string;
  image: string;
};

export type HeroLookDTO = {
  src: string;
  alt: string;
  /** Slug of the product this look links through to, when one is set. */
  productSlug: string | null;
};

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
  postedAt: string;
  /** Primary photo, already resolved to a servable path. */
  image: string;
};

/** A listing on its own page: everything above plus body copy and all photos. */
export type ListingDetailDTO = ListingDTO & {
  description: string;
  images: string[];
  sellerName: string;
  viewCount: number;
};

/** One page of listings plus enough context to render paging controls. */
export type ListingPageDTO = {
  items: ListingDTO[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
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
};

/** A browsable category with how many active listings it holds. */
export type ListingCategoryDTO = {
  slug: string;
  label: string;
  audience: string;
  total: number;
  image: string;
};

export type DashboardDTO = {
  heroLooks: HeroLookDTO[];
  products: ProductDTO[];
  categories: CategoryDTO[];
};

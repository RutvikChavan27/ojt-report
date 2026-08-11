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

export type DashboardDTO = {
  heroLooks: HeroLookDTO[];
  products: ProductDTO[];
  categories: CategoryDTO[];
};

/** Shapes returned by the API (what the frontend consumes). */

export type Gender = "Men" | "Women";

export type ProductDTO = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
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
};

export type DashboardDTO = {
  heroLooks: HeroLookDTO[];
  products: ProductDTO[];
  categories: CategoryDTO[];
};

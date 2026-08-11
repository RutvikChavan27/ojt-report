/** Base URL of the backend API. Override with VITE_API_URL in a .env file. */
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:5000";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  /** Cover photo — same as images[0]. */
  image: string;
  /** Every photo for this product, in display order. */
  images: string[];
  brand: string;
  color: string;
  variantCount?: number;
  sizes: string[];
  gender: string;
};

/** A marketplace listing as shown in a results grid. */
export type Listing = {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  audience: string;
  brand: string | null;
  size: string | null;
  colour: string | null;
  condition: string;
  price: number;
  city: string;
  postedAt: string;
  image: string;
};

/** A listing on its own page. */
export type ListingDetail = Listing & {
  description: string;
  images: string[];
  sellerName: string;
  viewCount: number;
};

export type ListingPage = {
  items: Listing[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
};

export type ListingCategory = {
  slug: string;
  label: string;
  audience: string;
  total: number;
  image: string;
};

export type HeroLook = {
  src: string;
  alt: string;
  /** Product this look links through to ("shop the look"), when set. */
  productSlug: string | null;
};
export type Category = { label: string; image: string };

type ApiEnvelope<T> = { success: boolean; data: T; message?: string };

/** Turns a stored image path ("/images/x.jpg") into an absolute API URL. */
export function resolveImage(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!body.success) throw new Error(body.message ?? "Request failed");
  return body.data;
}

const withImage = <T extends { image: string; images?: string[] }>(item: T): T => ({
  ...item,
  image: resolveImage(item.image),
  ...(item.images ? { images: item.images.map(resolveImage) } : {}),
});

/** GET products for a gender, with image paths resolved to absolute URLs. */
export async function fetchProducts(gender: string): Promise<Product[]> {
  const data = await getJson<Product[]>(
    `/api/products?gender=${encodeURIComponent(gender)}`,
  );
  return data.map(withImage);
}

/** GET "shop by category" tiles for a gender. */
export async function fetchCategories(gender: string): Promise<Category[]> {
  const data = await getJson<Category[]>(
    `/api/categories?gender=${encodeURIComponent(gender)}`,
  );
  return data.map(withImage);
}

/** GET hero lookbook images for a gender. */
export async function fetchHeroLooks(gender: string): Promise<HeroLook[]> {
  const data = await getJson<HeroLook[]>(
    `/api/hero-looks?gender=${encodeURIComponent(gender)}`,
  );
  return data.map((look) => ({ ...look, src: resolveImage(look.src) }));
}

/** GET one page of marketplace listings, optionally narrowed by category. */
export async function fetchListings(options: {
  category?: string;
  audience?: string;
  page?: number;
  perPage?: number;
}): Promise<ListingPage> {
  const params = new URLSearchParams();
  if (options.category) params.set("category", options.category);
  if (options.audience) params.set("audience", options.audience);
  params.set("page", String(options.page ?? 1));
  params.set("perPage", String(options.perPage ?? 24));

  const data = await getJson<ListingPage>(`/api/listings?${params.toString()}`);
  return { ...data, items: data.items.map(withImage) };
}

/** GET a single listing with all of its photos. */
export async function fetchListing(id: string): Promise<ListingDetail> {
  const data = await getJson<ListingDetail>(`/api/listings/${encodeURIComponent(id)}`);
  return {
    ...data,
    image: resolveImage(data.image),
    images: data.images.map(resolveImage),
  };
}

/** GET browsable categories with live listing counts. */
export async function fetchListingCategories(
  audience?: string,
): Promise<ListingCategory[]> {
  const params = audience ? `?audience=${encodeURIComponent(audience)}` : "";
  const data = await getJson<ListingCategory[]>(`/api/listing-categories${params}`);
  return data.map(withImage);
}

/** Full-text product search (backend ranks matches with Postgres tsvector/ts_rank). */
export async function fetchSearchResults(
  query: string,
  gender: string,
): Promise<Product[]> {
  const data = await getJson<Product[]>(
    `/api/search?q=${encodeURIComponent(query)}&gender=${encodeURIComponent(gender)}`,
  );
  return data.map(withImage);
}

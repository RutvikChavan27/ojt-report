import type { Product } from "../data/products";

/** Base URL of the backend API. Override with VITE_API_URL in a .env file. */
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:5000";

export type HeroLook = { src: string; alt: string };
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

const withImage = <T extends { image: string }>(item: T): T => ({
  ...item,
  image: resolveImage(item.image),
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

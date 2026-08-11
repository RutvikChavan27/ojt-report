import { findProductRows } from "../repositories/listing.repository";
import type { Gender, ProductDTO } from "../types/dto";

/** Fetches products, optionally filtered by gender, in authored order. */
export async function findProducts(gender?: Gender): Promise<ProductDTO[]> {
  const rows = await findProductRows(gender);

  return rows.map((row) => ({
    id: row.slug,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    rating: Number(row.rating),
    image: row.images[0],
    images: row.images,
    brand: row.brand,
    color: row.color,
    ...(row.variant_count != null ? { variantCount: row.variant_count } : {}),
    sizes: row.sizes,
    gender: row.gender,
  }));
}

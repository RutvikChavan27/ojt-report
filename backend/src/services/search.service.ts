import { searchProductRows } from "../repositories/search.repository";
import type { Gender, ProductDTO } from "../types/dto";

/** Full-text searches products by name/category/brand/color, ranked by relevance. */
export async function searchProducts(q: string, gender?: Gender): Promise<ProductDTO[]> {
  const rows = await searchProductRows(q, gender);

  return rows.map((row) => ({
    id: row.slug,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    rating: Number(row.rating),
    image: row.image,
    brand: row.brand,
    color: row.color,
    ...(row.variant_count != null ? { variantCount: row.variant_count } : {}),
    sizes: row.sizes,
    gender: row.gender,
  }));
}

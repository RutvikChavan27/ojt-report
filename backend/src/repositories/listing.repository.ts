import { query } from "../config/database";
import type { Gender } from "../types/dto";

export type ProductRow = {
  slug: string;
  name: string;
  category: string;
  price: string;
  original_price: string;
  rating: string;
  image: string;
  brand: string;
  color: string;
  variant_count: number | null;
  sizes: string[];
  gender: Gender;
};

/** Fetches product rows, optionally filtered by gender, in authored order. */
export async function findProductRows(gender?: Gender): Promise<ProductRow[]> {
  const { rows } = gender
    ? await query<ProductRow>(
        `SELECT slug, name, category, price, original_price, rating, image, brand, color, variant_count, sizes, gender
         FROM products WHERE gender = $1 ORDER BY "order" ASC`,
        [gender]
      )
    : await query<ProductRow>(
        `SELECT slug, name, category, price, original_price, rating, image, brand, color, variant_count, sizes, gender
         FROM products ORDER BY "order" ASC`
      );

  return rows;
}

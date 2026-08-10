import { query } from "../config/database";
import { SEARCH_PRODUCTS_SQL } from "../db/queries/search.sql";
import type { Gender } from "../types/dto";
import type { ProductRow } from "./listing.repository";

export type ProductSearchRow = ProductRow & { rank: string };

/** Ranked full-text search over products, optionally narrowed by gender. */
export async function searchProductRows(q: string, gender?: Gender): Promise<ProductSearchRow[]> {
  const { rows } = await query<ProductSearchRow>(SEARCH_PRODUCTS_SQL, [q, gender ?? null]);
  return rows;
}

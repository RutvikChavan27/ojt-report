import { findProducts } from "./listing.service";
import { findCategories, findHeroLooks } from "./catalog.service";
import type { DashboardDTO, Gender } from "../types/dto";

/**
 * Aggregates everything the Dashboard page needs for one gender in a single
 * round trip: hero lookbook, trending products, and category tiles.
 */
export async function getDashboard(gender?: Gender): Promise<DashboardDTO> {
  const [heroLooks, products, categories] = await Promise.all([
    findHeroLooks(gender),
    findProducts(gender),
    findCategories(gender),
  ]);

  return { heroLooks, products, categories };
}

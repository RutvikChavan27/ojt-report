import { query } from "../config/database";
import type { CategoryDTO, Gender, HeroLookDTO } from "../types/dto";

type CategoryRow = { label: string; image: string };
type HeroLookRow = { src: string; alt: string; product_slug: string | null };

/** Fetches the "Shop by category" tiles for a gender, in authored order. */
export async function findCategories(gender?: Gender): Promise<CategoryDTO[]> {
  const { rows } = gender
    ? await query<CategoryRow>(
        'SELECT label, image FROM categories WHERE gender = $1 ORDER BY "order" ASC',
        [gender]
      )
    : await query<CategoryRow>('SELECT label, image FROM categories ORDER BY "order" ASC');

  return rows.map((row) => ({ label: row.label, image: row.image }));
}

/** Fetches the hero lookbook images for a gender, in authored order. */
export async function findHeroLooks(gender?: Gender): Promise<HeroLookDTO[]> {
  const { rows } = gender
    ? await query<HeroLookRow>(
        'SELECT src, alt, product_slug FROM hero_looks WHERE gender = $1 ORDER BY "order" ASC',
        [gender]
      )
    : await query<HeroLookRow>(
        'SELECT src, alt, product_slug FROM hero_looks ORDER BY "order" ASC'
      );

  return rows.map((row) => ({
    src: row.src,
    alt: row.alt,
    productSlug: row.product_slug,
  }));
}

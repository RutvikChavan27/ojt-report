import { Category } from "../models/category.model";
import { HeroLook } from "../models/heroLook.model";
import type { CategoryDTO, Gender, HeroLookDTO } from "../types/dto";

/** Fetches the "Shop by category" tiles for a gender, in authored order. */
export async function findCategories(gender?: Gender): Promise<CategoryDTO[]> {
  const filter = gender ? { gender } : {};
  const docs = await Category.find(filter).sort({ order: 1 }).lean();
  return docs.map((doc) => ({ label: doc.label, image: doc.image }));
}

/** Fetches the hero lookbook images for a gender, in authored order. */
export async function findHeroLooks(gender?: Gender): Promise<HeroLookDTO[]> {
  const filter = gender ? { gender } : {};
  const docs = await HeroLook.find(filter).sort({ order: 1 }).lean();
  return docs.map((doc) => ({ src: doc.src, alt: doc.alt }));
}

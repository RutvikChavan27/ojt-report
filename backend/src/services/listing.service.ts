import { Product } from "../models/product.model";
import type { Gender, ProductDTO } from "../types/dto";

/** Fetches products, optionally filtered by gender, in authored order. */
export async function findProducts(gender?: Gender): Promise<ProductDTO[]> {
  const filter = gender ? { gender } : {};
  const docs = await Product.find(filter).sort({ order: 1 }).lean();

  return docs.map((doc) => ({
    id: doc.slug,
    name: doc.name,
    category: doc.category,
    price: doc.price,
    originalPrice: doc.originalPrice,
    rating: doc.rating,
    image: doc.image,
    brand: doc.brand,
    color: doc.color,
    ...(doc.variantCount != null ? { variantCount: doc.variantCount } : {}),
    gender: doc.gender as Gender,
  }));
}

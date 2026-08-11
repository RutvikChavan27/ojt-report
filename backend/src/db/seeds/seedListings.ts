/**
 * Seeds PostgreSQL with all of the Dashboard's previously-static data:
 * products (TopProducts), category tiles (ShopByCategory) and hero looks (Hero).
 *
 * Run with:  npm run seed
 *
 * Image fields store a path relative to the API host (e.g. "/images/foo.jpg").
 * The matching files must exist under backend/uploads/images (see README).
 */
import { config } from "../../config/env";
import { connectDatabase, disconnectDatabase, query } from "../../config/database";

const img = (file: string) => `${config.imagesRoute}/${file}`;

const MEN_PRODUCTS = [
  { slug: "seersucker-shirt", name: "Embroidered Seersucker Shirt", category: "V-Neck T Shirt", price: 99, originalPrice: 199, rating: 4.6, images: [img("product-seersucker-shirt.jpg")], brand: "Thread Studio", color: "Blue", sizes: ["S", "M", "L", "XL"] },
  { slug: "slim-fit-tee", name: "Basic Slim Fit T-Shirt", category: "Cotton T Shirt", price: 99, originalPrice: 179, rating: 4.3, variantCount: 3, images: [img("product-slim-fit-tee.jpg")], brand: "Thread Essentials", color: "White", sizes: ["XS", "S", "M", "L", "XL"] },
  { slug: "henley-tee", name: "Blurred Print T-Shirt", category: "Henley T Shirt", price: 99, originalPrice: 189, rating: 4.5, variantCount: 3, images: [img("product-blurred-print-tee.jpg")], brand: "Thread Studio", color: "Beige", sizes: ["S", "M", "L"] },
  { slug: "zip-crewneck", name: "Full Sleeve Zipper", category: "Crewneck T Shirt", price: 99, originalPrice: 199, rating: 4.7, variantCount: 2, images: [img("product-zip-crewneck.jpg")], brand: "Thread Essentials", color: "White", sizes: ["S", "M", "L", "XL"] },
  { slug: "dotted-chambray-shirt", name: "Dotted Chambray Shirt", category: "Button-Up Shirt", price: 89, originalPrice: 169, rating: 4.4, images: [img("product-seersucker-shirt-2.jpg")], brand: "Thread Denim Co.", color: "Blue", sizes: ["M", "L", "XL"] },
  { slug: "knit-sweater", name: "Textured Knit Sweater", category: "Crewneck Sweater", price: 109, originalPrice: 219, rating: 4.8, images: [img("product-blurred-print-tee-2.jpg")], brand: "Thread Studio", color: "White", sizes: ["S", "M", "L"] },
  { slug: "graphic-print-tee", name: "Graphic Print Tee", category: "Oversized T Shirt", price: 79, originalPrice: 159, rating: 4.2, variantCount: 4, images: [img("product-zip-crewneck-2.jpg")], brand: "Thread Essentials", color: "Yellow", sizes: ["XS", "S", "M", "L"] },
  { slug: "fleece-hoodie", name: "Folded Fleece Hoodie", category: "Pullover Hoodie", price: 119, originalPrice: 229, rating: 4.6, images: [img("product-fleece-hoodie.jpg")], brand: "Thread Studio", color: "Navy", sizes: ["M", "L", "XL"] },
  { slug: "plaid-shirt-jacket", name: "Plaid Shirt-Jacket", category: "Shirt Jacket", price: 129, originalPrice: 249, rating: 4.7, images: [img("hero-look-3b.jpg")], brand: "Thread Studio", color: "Brown", sizes: ["S", "M", "L", "XL"] },
  { slug: "relaxed-cotton-tee", name: "Relaxed Cotton Tee", category: "Cotton T Shirt", price: 69, originalPrice: 139, rating: 4.2, images: [img("product-slim-fit-tee-2.jpg")], brand: "Thread Essentials", color: "White", sizes: ["XS", "S", "M", "L"] },
  { slug: "cream-tapered-trousers", name: "Cream Tapered Trousers", category: "Trousers", price: 109, originalPrice: 209, rating: 4.5, images: [img("hero-look-1.jpg")], brand: "Thread Studio", color: "Cream", sizes: ["S", "M", "L", "XL"] },
  { slug: "khaki-chino-trousers", name: "Khaki Chino Trousers", category: "Trousers", price: 99, originalPrice: 189, rating: 4.4, images: [img("hero-look-1b.jpg")], brand: "Thread Essentials", color: "Khaki", sizes: ["S", "M", "L", "XL"] },
  { slug: "ripped-slim-jeans", name: "Ripped Slim Jeans", category: "Slim Jeans", price: 119, originalPrice: 229, rating: 4.6, variantCount: 2, images: [img("hero-look-1c.jpg")], brand: "Thread Denim Co.", color: "Blue", sizes: ["S", "M", "L"] },
  { slug: "vintage-graphic-tee", name: "Vintage Graphic Tee", category: "Graphic Tee", price: 79, originalPrice: 159, rating: 4.3, images: [img("hero-look-2.jpg")], brand: "Thread Studio", color: "Black", sizes: ["S", "M", "L", "XL"] },
  { slug: "white-graphic-tee", name: "White Graphic Print Tee", category: "Graphic Tee", price: 75, originalPrice: 149, rating: 4.4, variantCount: 3, images: [img("hero-look-2b.jpg")], brand: "Thread Essentials", color: "White", sizes: ["XS", "S", "M", "L"] },
  { slug: "street-graphic-tee", name: "Street Graphic Tee", category: "Graphic Tee", price: 82, originalPrice: 165, rating: 4.5, images: [img("hero-look-2c.jpg")], brand: "Thread Essentials", color: "Grey", sizes: ["S", "M", "L", "XL"] },
  { slug: "gingham-coord-set", name: "Grey Gingham Co-ord Set", category: "Co-ords", price: 149, originalPrice: 289, rating: 4.8, images: [img("hero-look-3.jpg")], brand: "Thread Studio", color: "Grey", sizes: ["S", "M", "L"] },
];

const WOMEN_PRODUCTS = [
  { slug: "wrap-blouse", name: "Floral Wrap Blouse", category: "Wrap Top", price: 99, originalPrice: 189, rating: 4.5, images: [img("product-women-wrap-blouse.jpg")], brand: "Thread Studio", color: "Cream", sizes: ["XS", "S", "M", "L"] },
  { slug: "crop-top", name: "Ribbed Crop Top", category: "Crop Top", price: 99, originalPrice: 179, rating: 4.3, variantCount: 3, images: [img("product-women-crop-top.jpg")], brand: "Thread Essentials", color: "Cream", sizes: ["XS", "S", "M"] },
  { slug: "tie-dye-tee", name: "Tie-Dye Oversized Tee", category: "Graphic Tee", price: 99, originalPrice: 189, rating: 4.6, variantCount: 3, images: [img("product-women-tie-dye-tee.jpg")], brand: "Thread Essentials", color: "Black", sizes: ["S", "M", "L", "XL"] },
  { slug: "wide-jeans", name: "High-Waist Wide Jeans", category: "Wide-Leg Jeans", price: 99, originalPrice: 199, rating: 4.7, variantCount: 2, images: [img("product-women-wide-jeans.jpg")], brand: "Thread Denim Co.", color: "Blue", sizes: ["S", "M", "L"] },
  { slug: "midi-skirt", name: "Pleated Midi Skirt", category: "Midi Skirt", price: 89, originalPrice: 169, rating: 4.4, images: [img("product-women-midi-skirt.jpg")], brand: "Thread Studio", color: "Rust", sizes: ["XS", "S", "M", "L"] },
  { slug: "cardigan", name: "Cable Knit Cardigan", category: "Cardigan", price: 109, originalPrice: 219, rating: 4.8, images: [img("product-women-cardigan.jpg")], brand: "Thread Studio", color: "Brown", sizes: ["S", "M", "L", "XL"] },
  { slug: "slip-dress", name: "Satin Slip Dress", category: "Slip Dress", price: 79, originalPrice: 159, rating: 4.5, variantCount: 4, images: [img("product-women-slip-dress.jpg")], brand: "Thread Studio", color: "Red", sizes: ["XS", "S", "M"] },
  { slug: "puffer-jacket", name: "Cropped Puffer Jacket", category: "Puffer Jacket", price: 119, originalPrice: 229, rating: 4.6, images: [img("product-women-puffer-jacket.jpg")], brand: "Thread Essentials", color: "Yellow", sizes: ["S", "M", "L", "XL"] },
  { slug: "ribbed-tank-top", name: "Ribbed Tank Top", category: "Sleeveless Top", price: 59, originalPrice: 119, rating: 4.4, variantCount: 3, images: [img("category-women-tops.jpg")], brand: "Thread Essentials", color: "White", sizes: ["XS", "S", "M", "L"] },
  { slug: "floral-midi-dress", name: "Floral Midi Dress", category: "Midi Dress", price: 129, originalPrice: 249, rating: 4.7, images: [img("category-women-dresses.jpg")], brand: "Thread Studio", color: "Cream", sizes: ["XS", "S", "M", "L"] },
  { slug: "pleated-sleeve-blouse", name: "Pleated Sleeve Blouse", category: "Blouse", price: 95, originalPrice: 185, rating: 4.5, images: [img("category-women-blouses.jpg")], brand: "Thread Studio", color: "Pink", sizes: ["XS", "S", "M", "L"] },
  { slug: "straight-leg-denim", name: "Straight Leg Denim", category: "Straight Jeans", price: 109, originalPrice: 209, rating: 4.6, variantCount: 2, images: [img("category-women-denim.jpg")], brand: "Thread Denim Co.", color: "Blue", sizes: ["S", "M", "L", "XL"] },
  { slug: "aline-mini-skirt", name: "A-Line Mini Skirt", category: "Mini Skirt", price: 79, originalPrice: 155, rating: 4.3, images: [img("category-women-skirts.jpg")], brand: "Thread Studio", color: "Black", sizes: ["XS", "S", "M"] },
  { slug: "soft-knit-pullover", name: "Soft Knit Pullover", category: "Knitwear", price: 115, originalPrice: 225, rating: 4.7, images: [img("category-women-knitwear.jpg")], brand: "Thread Studio", color: "Beige", sizes: ["S", "M", "L", "XL"] },
  { slug: "longline-trench-coat", name: "Longline Trench Coat", category: "Outerwear", price: 179, originalPrice: 349, rating: 4.8, images: [img("category-women-outerwear.jpg")], brand: "Thread Studio", color: "Camel", sizes: ["S", "M", "L"] },
  { slug: "lounge-jogger-set", name: "Lounge Jogger Set", category: "Loungewear", price: 99, originalPrice: 195, rating: 4.5, variantCount: 2, images: [img("category-women-loungewear.jpg")], brand: "Thread Essentials", color: "Grey", sizes: ["XS", "S", "M", "L"] },
  { slug: "active-seamless-leggings", name: "Active Seamless Leggings", category: "Activewear", price: 89, originalPrice: 175, rating: 4.6, variantCount: 4, images: [img("category-women-activewear.jpg")], brand: "Thread Essentials", color: "Black", sizes: ["XS", "S", "M", "L"] },
  { slug: "linen-coord-set", name: "Linen Co-ord Set", category: "Co-ords", price: 139, originalPrice: 269, rating: 4.7, images: [img("category-women-coords.jpg")], brand: "Thread Studio", color: "Sand", sizes: ["S", "M", "L"] },
  { slug: "canvas-sneakers", name: "Canvas Sneakers", category: "Footwear", price: 89, originalPrice: 169, rating: 4.4, images: [img("category-women-footwear.jpg")], brand: "Thread Essentials", color: "White", sizes: ["S", "M", "L"] },
];

const MEN_CATEGORIES = [
  { label: "T-shirts", image: img("product-slim-fit-tee.jpg") },
  { label: "Graphic Tees", image: img("hero-look-2.jpg") },
  { label: "Shirts", image: img("product-seersucker-shirt.jpg") },
  { label: "Denim", image: img("hero-look-1c.jpg") },
  { label: "Trousers", image: img("hero-look-1.jpg") },
  { label: "Knitwear", image: img("product-blurred-print-tee-2.jpg") },
  { label: "Hoodies", image: img("product-fleece-hoodie.jpg") },
  { label: "Co-ords", image: img("hero-look-3.jpg") },
  { label: "Street Style", image: img("hero-look-2c.jpg") },
  { label: "Weekend Looks", image: img("hero-look-3b.jpg") },
];

const WOMEN_CATEGORIES = [
  { label: "Tops", image: img("category-women-tops.jpg") },
  { label: "Dresses", image: img("category-women-dresses.jpg") },
  { label: "Blouses", image: img("category-women-blouses.jpg") },
  { label: "Denim", image: img("category-women-denim.jpg") },
  { label: "Skirts", image: img("category-women-skirts.jpg") },
  { label: "Knitwear", image: img("category-women-knitwear.jpg") },
  { label: "Loungewear", image: img("category-women-loungewear.jpg") },
  { label: "Co-ords", image: img("category-women-coords.jpg") },
  { label: "Activewear", image: img("category-women-activewear.jpg") },
  { label: "Outerwear", image: img("category-women-outerwear.jpg") },
];

/**
 * The "New Collection" strip shows one product per garment type. Each entry is
 * built *from* the product it links to, so the photo on the strip is always the
 * same photo the product page opens with — they cannot drift apart.
 *
 * To change what the strip features, edit the slug lists below.
 */
// First four are the headline garment types (they fill the first slide); the
// rest flow onto the next slide of the strip.
const MEN_LOOK_SLUGS = [
  "seersucker-shirt", // Shirt
  "slim-fit-tee", // T-Shirt
  "fleece-hoodie", // Hoodie
  "plaid-shirt-jacket", // Jacket
  "henley-tee",
  "zip-crewneck",
  "dotted-chambray-shirt",
  "knit-sweater",
];

const WOMEN_LOOK_SLUGS = [
  "midi-skirt", // Skirt
  "crop-top", // Crop Top
  "cardigan", // stands in for a hoodie — no women's hoodie photo exists yet
  "ribbed-tank-top", // Sleeveless Top
  "floral-midi-dress",
  "longline-trench-coat",
  "straight-leg-denim",
  "linen-coord-set",
];

type SeedProduct = { slug: string; name: string; images: string[] };

/**
 * Every product must own its photos outright — a repeated image makes two
 * different products look like the same item. Fails the seed rather than
 * letting a duplicate reach the catalogue.
 */
function assertNoSharedPhotos(products: SeedProduct[]): void {
  const owner = new Map<string, string>();
  for (const product of products) {
    if (product.images.length === 0) {
      throw new Error(`[seed] ${product.slug} has no photos`);
    }
    for (const src of product.images) {
      const existing = owner.get(src);
      if (existing) {
        throw new Error(
          `[seed] ${src} is used by both "${existing}" and "${product.slug}" — every product needs its own photo`,
        );
      }
      owner.set(src, product.slug);
    }
  }
}

/** Builds a strip entry from a product, failing loudly on an unknown slug. */
function lookFromProduct(products: SeedProduct[], slug: string) {
  const product = products.find((candidate) => candidate.slug === slug);
  if (!product) {
    throw new Error(`[seed] New Collection references unknown product: ${slug}`);
  }
  return { src: product.images[0], alt: product.name, productSlug: product.slug };
}

assertNoSharedPhotos([...MEN_PRODUCTS, ...WOMEN_PRODUCTS]);

const MEN_LOOKS = MEN_LOOK_SLUGS.map((slug) => lookFromProduct(MEN_PRODUCTS, slug));
const WOMEN_LOOKS = WOMEN_LOOK_SLUGS.map((slug) =>
  lookFromProduct(WOMEN_PRODUCTS, slug),
);

/** Adds gender + order to each row so lists come back in the authored sequence. */
function withMeta<T>(rows: T[], gender: "Men" | "Women"): (T & { gender: string; order: number })[] {
  return rows.map((row, index) => ({ ...row, gender, order: index }));
}

/** Builds a parameterised multi-row INSERT for a fixed set of columns. */
function insertRows(
  table: string,
  columns: string[],
  rows: Record<string, unknown>[]
): { text: string; values: unknown[] } {
  const values: unknown[] = [];
  const tuples = rows.map((row) => {
    const placeholders = columns.map((col) => {
      values.push(row[col] ?? null);
      return `$${values.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });

  const quotedColumns = columns.map((col) => `"${col}"`).join(", ");
  return {
    text: `INSERT INTO ${table} (${quotedColumns}) VALUES ${tuples.join(", ")}`,
    values,
  };
}

async function seed(): Promise<void> {
  await connectDatabase(config.databaseUrl);

  await query('TRUNCATE TABLE products, categories, hero_looks RESTART IDENTITY');

  const products = [...withMeta(MEN_PRODUCTS, "Men"), ...withMeta(WOMEN_PRODUCTS, "Women")].map(
    (p) => ({ ...p, variant_count: "variantCount" in p ? p.variantCount : null, original_price: p.originalPrice })
  );
  const categories = [...withMeta(MEN_CATEGORIES, "Men"), ...withMeta(WOMEN_CATEGORIES, "Women")];
  const heroLooks = [...withMeta(MEN_LOOKS, "Men"), ...withMeta(WOMEN_LOOKS, "Women")];

  const productsInsert = insertRows(
    "products",
    ["slug", "name", "category", "price", "original_price", "rating", "images", "brand", "color", "variant_count", "sizes", "gender", "order"],
    products
  );
  const categoriesInsert = insertRows(
    "categories",
    ["label", "image", "gender", "order"],
    categories
  );
  const heroLooksInsert = insertRows(
    "hero_looks",
    ["src", "alt", "product_slug", "gender", "order"],
    heroLooks.map((look) => ({ ...look, product_slug: look.productSlug }))
  );

  await query(productsInsert.text, productsInsert.values);
  await query(categoriesInsert.text, categoriesInsert.values);
  await query(heroLooksInsert.text, heroLooksInsert.values);

  console.log(`[seed] inserted ${products.length} products`);
  console.log(`[seed] inserted ${categories.length} categories`);
  console.log(`[seed] inserted ${heroLooks.length} hero looks`);

  await disconnectDatabase();
  console.log("[seed] done");
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});

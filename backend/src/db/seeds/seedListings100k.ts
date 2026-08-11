/**
 * Seeds the marketplace with 100,000+ second-hand clothing listings.
 *
 * Run with:  npm run seed:listings          (default 100000)
 *            npm run seed:listings -- 5000  (smaller set while developing)
 *
 * The brief requires this volume because search behaviour at a hundred thousand
 * rows is nothing like search behaviour at two hundred. Everything is generated
 * from a deterministic PRNG so a given size always produces the same catalogue,
 * which keeps query-plan comparisons meaningful between runs.
 *
 * Rows go in as batched multi-row INSERTs (5,000 at a time) rather than one
 * statement per row, which is the difference between minutes and seconds here.
 * ANALYZE runs at the end so the planner has real statistics to work from.
 */
import { config } from "../../config/env";
import { connectDatabase, disconnectDatabase, query } from "../../config/database";

/** A single column value in a generated row. */
type SeedValue = string | number | boolean | null;

const DEFAULT_COUNT = 100_000;
const SELLER_COUNT = 2_000;

/**
 * The Postgres wire protocol caps a statement at 65,535 bound parameters, so the
 * batch size has to be derived from the column count rather than fixed: 5,000
 * listing rows x 16 columns would blow straight past it.
 */
const MAX_PARAMS_PER_STATEMENT = 60_000;

/**
 * Mulberry32 — a small deterministic PRNG. Math.random cannot be seeded, and an
 * unseeded catalogue would make before/after index timings incomparable.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20260812);

const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];

/** Integer in [min, max]. */
const pickInt = (min: number, max: number): number =>
  min + Math.floor(random() * (max - min + 1));

/**
 * Skews towards the low end, so most listings are cheap and expensive ones are
 * rare — a flat price distribution would make the price facets meaningless.
 */
const skewedPrice = (min: number, max: number): number => {
  const skew = random() * random();
  return Math.round((min + skew * (max - min)) / 50) * 50 || min;
};

const MEN_CATEGORIES = [
  { slug: "mens-shirts", label: "Shirts" },
  { slug: "mens-tshirts", label: "T-Shirts" },
  { slug: "mens-hoodies", label: "Hoodies & Sweatshirts" },
  { slug: "mens-jackets", label: "Jackets & Coats" },
  { slug: "mens-jeans", label: "Jeans" },
  { slug: "mens-trousers", label: "Trousers & Chinos" },
  { slug: "mens-knitwear", label: "Knitwear" },
  { slug: "mens-shoes", label: "Shoes" },
] as const;

const WOMEN_CATEGORIES = [
  { slug: "womens-tops", label: "Tops" },
  { slug: "womens-dresses", label: "Dresses" },
  { slug: "womens-skirts", label: "Skirts" },
  { slug: "womens-jeans", label: "Jeans" },
  { slug: "womens-hoodies", label: "Hoodies & Sweatshirts" },
  { slug: "womens-jackets", label: "Jackets & Coats" },
  { slug: "womens-knitwear", label: "Knitwear" },
  { slug: "womens-shoes", label: "Shoes" },
] as const;

/** Garment nouns per category, used to build believable titles. */
const GARMENTS: Record<string, readonly string[]> = {
  "mens-shirts": ["Oxford Shirt", "Linen Shirt", "Flannel Shirt", "Chambray Shirt", "Camp Collar Shirt"],
  "mens-tshirts": ["Cotton T-Shirt", "Graphic Tee", "Pocket Tee", "Oversized Tee", "Henley Tee"],
  "mens-hoodies": ["Pullover Hoodie", "Zip Hoodie", "Crewneck Sweatshirt", "Fleece Hoodie"],
  "mens-jackets": ["Denim Jacket", "Bomber Jacket", "Puffer Jacket", "Overshirt", "Trench Coat"],
  "mens-jeans": ["Slim Jeans", "Straight Jeans", "Relaxed Jeans", "Tapered Jeans"],
  "mens-trousers": ["Chinos", "Pleated Trousers", "Cargo Trousers", "Linen Trousers"],
  "mens-knitwear": ["Merino Jumper", "Cable Knit Sweater", "Cardigan", "Lambswool Jumper"],
  "mens-shoes": ["Canvas Sneakers", "Leather Trainers", "Chelsea Boots", "Loafers"],
  "womens-tops": ["Ribbed Tank Top", "Silk Blouse", "Wrap Top", "Cropped Tee", "Peplum Top"],
  "womens-dresses": ["Midi Dress", "Slip Dress", "Wrap Dress", "Shirt Dress", "Floral Sundress"],
  "womens-skirts": ["Pleated Midi Skirt", "Denim Mini Skirt", "A-Line Skirt", "Wrap Skirt"],
  "womens-jeans": ["High-Waist Jeans", "Wide-Leg Jeans", "Mom Jeans", "Skinny Jeans"],
  "womens-hoodies": ["Cropped Hoodie", "Oversized Hoodie", "Zip Sweatshirt", "Fleece Pullover"],
  "womens-jackets": ["Denim Jacket", "Puffer Jacket", "Blazer", "Trench Coat", "Shacket"],
  "womens-knitwear": ["Cable Knit Jumper", "Cardigan", "Merino Sweater", "Knit Vest"],
  "womens-shoes": ["Canvas Sneakers", "Ankle Boots", "Ballet Flats", "Chunky Loafers"],
};

const BRANDS = [
  "Levi's", "Zara", "H&M", "Uniqlo", "Nike", "Adidas", "Mango", "Only",
  "Jack & Jones", "Allen Solly", "Van Heusen", "Roadster", "Superdry",
  "Tommy Hilfiger", "Marks & Spencer", "FabIndia", "Biba", "W for Woman",
  "Puma", "Champion", "Vero Moda", "AND", "Peter England", "US Polo Assn.",
  "Wrangler", "Pepe Jeans", "Forever 21", "Bershka", "COS", "Muji",
];

const COLOURS = [
  "Black", "White", "Navy", "Grey", "Beige", "Cream", "Olive", "Brown",
  "Blue", "Indigo", "Maroon", "Rust", "Mustard", "Pink", "Lavender",
  "Sage", "Charcoal", "Teal", "Burgundy", "Camel",
];

/** City-level location only — the brief rules out radius search. */
const CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata",
  "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Indore", "Nagpur", "Chandigarh",
  "Kochi", "Bhopal", "Coimbatore", "Visakhapatnam", "Nashik", "Thane",
];

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"];
const CONDITIONS = ["New with tags", "Like new", "Good", "Fair"] as const;
const FITS = ["Relaxed fit", "Slim fit", "Regular fit", "Oversized fit"];
const FABRICS = ["100% cotton", "cotton blend", "linen blend", "denim", "merino wool", "fleece-lined"];

/**
 * Seed photos are drawn from the existing image pool. At a hundred thousand
 * listings the same photo necessarily recurs — real photography would come from
 * seller uploads, which is a separate feature.
 */
const PHOTO_POOL = [
  "product-seersucker-shirt.jpg", "product-seersucker-shirt-2.jpg",
  "product-slim-fit-tee.jpg", "product-slim-fit-tee-2.jpg",
  "product-blurred-print-tee.jpg", "product-blurred-print-tee-2.jpg",
  "product-zip-crewneck.jpg", "product-zip-crewneck-2.jpg",
  "product-fleece-hoodie.jpg",
  "hero-look-1.jpg", "hero-look-1b.jpg", "hero-look-1c.jpg",
  "hero-look-2.jpg", "hero-look-2b.jpg", "hero-look-2c.jpg",
  "hero-look-3.jpg", "hero-look-3b.jpg", "hero-look-3c.jpg",
  "product-women-wrap-blouse.jpg", "product-women-crop-top.jpg",
  "product-women-tie-dye-tee.jpg", "product-women-wide-jeans.jpg",
  "product-women-midi-skirt.jpg", "product-women-cardigan.jpg",
  "product-women-slip-dress.jpg", "product-women-puffer-jacket.jpg",
  "category-women-tops.jpg", "category-women-dresses.jpg",
  "category-women-blouses.jpg", "category-women-denim.jpg",
  "category-women-skirts.jpg", "category-women-knitwear.jpg",
  "category-women-loungewear.jpg", "category-women-coords.jpg",
  "category-women-activewear.jpg", "category-women-outerwear.jpg",
  "category-women-footwear.jpg",
  "hero-look-women-1.jpg", "hero-look-women-2.jpg", "hero-look-women-3.jpg",
  "hero-look-women-4.jpg", "hero-look-women-5.jpg", "hero-look-women-6.jpg",
  "hero-look-women-7.jpg", "hero-look-women-8.jpg",
];

const img = (file: string) => `${config.imagesRoute}/${file}`;

/**
 * Loads rows in batches sized to stay under the bound-parameter limit. Values
 * stay parameterised even here: generated titles contain apostrophes, and
 * string-concatenating them would both break and set a bad precedent for the
 * query-building code.
 */
async function insertRows(table: string, columns: string[], rows: SeedValue[][]) {
  if (rows.length === 0) return;
  const batchSize = Math.max(1, Math.floor(MAX_PARAMS_PER_STATEMENT / columns.length));

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: config.databaseUrl });
  await client.connect();
  try {
    for (let offset = 0; offset < rows.length; offset += batchSize) {
      const batch = rows.slice(offset, offset + batchSize);
      const values: SeedValue[] = [];
      const tuples = batch.map((row) => {
        const placeholders = row.map((value) => {
          values.push(value);
          return `$${values.length}`;
        });
        return `(${placeholders.join(",")})`;
      });
      await client.query(
        `INSERT INTO ${table} (${columns.map((c) => `"${c}"`).join(",")}) VALUES ${tuples.join(",")}`,
        values,
      );
    }
  } finally {
    await client.end();
  }
}

function buildTitle(garment: string, brand: string, colour: string): string {
  const shape = random();
  if (shape < 0.45) return `${brand} ${colour} ${garment}`;
  if (shape < 0.75) return `${colour} ${garment}`;
  return `${brand} ${garment}`;
}

function buildDescription(
  garment: string,
  brand: string,
  colour: string,
  size: string,
  condition: string,
): string {
  const fit = pick(FITS);
  const fabric = pick(FABRICS);
  const notes = [
    `Selling my ${colour.toLowerCase()} ${garment.toLowerCase()} from ${brand}.`,
    `${fit}, ${fabric}. Size ${size}.`,
    condition === "New with tags"
      ? "Brand new, never worn, tags still attached."
      : condition === "Like new"
        ? "Worn once or twice, no marks or pilling."
        : condition === "Good"
          ? "Worn a handful of times, plenty of life left."
          : "Well loved with some wear — priced accordingly.",
    pick([
      "Collection preferred, can post at cost.",
      "Happy to post anywhere in India.",
      "No returns, please ask questions before buying.",
      "Smoke-free and pet-free home.",
      "Bundle with my other listings for a discount.",
    ]),
  ];
  return notes.join(" ");
}

async function seed(): Promise<void> {
  const requested = Number(process.argv[2] ?? DEFAULT_COUNT);
  const total = Number.isFinite(requested) && requested > 0 ? requested : DEFAULT_COUNT;

  await connectDatabase(config.databaseUrl);
  const startedAt = Date.now();

  console.log(`[seed] generating ${total.toLocaleString()} listings…`);

  await query(
    "TRUNCATE TABLE listing_photos, saved_searches, listings, listing_categories, oauth_identities, users RESTART IDENTITY CASCADE",
  );

  // --- categories ---------------------------------------------------------
  const categories = [
    ...MEN_CATEGORIES.map((c, i) => [c.slug, c.label, "Men", i]),
    ...WOMEN_CATEGORIES.map((c, i) => [c.slug, c.label, "Women", i]),
  ];
  await insertRows("listing_categories", ["slug", "label", "audience", "order"], categories);

  // --- sellers ------------------------------------------------------------
  // A shared dummy hash: these accounts exist to own listings, not to log in.
  const sellerRows = Array.from({ length: SELLER_COUNT }, (_, i) => [
    `seller${i + 1}@bazaar.test`,
    null,
    `Seller ${i + 1}`,
  ]);
  await insertRows("users", ["email", "password_hash", "display_name"], sellerRows);
  console.log(`[seed] inserted ${SELLER_COUNT.toLocaleString()} sellers`);

  // --- listings -----------------------------------------------------------
  const now = Date.now();
  const EIGHTEEN_MONTHS_MS = 18 * 30 * 24 * 60 * 60 * 1000;
  const SHELF_LIFE_MS = 45 * 24 * 60 * 60 * 1000; // how long a listing stays live
  const listingRows: SeedValue[][] = [];
  const photoRows: SeedValue[][] = [];

  for (let i = 1; i <= total; i++) {
    const forMen = random() < 0.5;
    const category = forMen ? pick(MEN_CATEGORIES) : pick(WOMEN_CATEGORIES);
    const audience = forMen ? "Men" : "Women";
    const garment = pick(GARMENTS[category.slug]);
    const brand = pick(BRANDS);
    const colour = pick(COLOURS);
    const size = category.slug.endsWith("shoes") ? pick(SHOE_SIZES) : pick(CLOTHING_SIZES);
    const condition = pick(CONDITIONS);

    // Status is chosen first, then dates are made consistent with it. Deriving
    // status from a date spread instead left almost everything expired, which
    // would shrink the searchable set to a few thousand rows and defeat the
    // point of seeding a hundred thousand.
    const roll = random();
    let status: "active" | "sold" | "expired";
    if (roll < 0.7) status = "active";
    else if (roll < 0.82) status = "sold";
    else status = "expired";

    let postedAt: Date;
    let soldAt: string | null = null;

    if (status === "active") {
      // Still inside its 45-day window, so it has to be recent.
      postedAt = new Date(now - Math.floor(random() * SHELF_LIFE_MS));
    } else if (status === "sold") {
      postedAt = new Date(now - Math.floor(random() * EIGHTEEN_MONTHS_MS));
      soldAt = new Date(
        postedAt.getTime() + Math.floor(random() * SHELF_LIFE_MS),
      ).toISOString();
    } else {
      // Expired: posted long enough ago that its window has closed.
      postedAt = new Date(
        now - SHELF_LIFE_MS - Math.floor(random() * (EIGHTEEN_MONTHS_MS - SHELF_LIFE_MS)),
      );
    }

    const expiresAt = new Date(postedAt.getTime() + SHELF_LIFE_MS);

    listingRows.push([
      pickInt(1, SELLER_COUNT),
      buildTitle(garment, brand, colour),
      buildDescription(garment, brand, colour, size, condition),
      category.slug,
      audience,
      brand,
      size,
      colour,
      condition,
      skewedPrice(150, 12_000),
      pick(CITIES),
      status,
      pickInt(0, 900),
      postedAt.toISOString(),
      expiresAt.toISOString(),
      soldAt,
    ]);

    // 1-4 photos each, first one primary.
    const photoCount = pickInt(1, 4);
    for (let p = 0; p < photoCount; p++) {
      photoRows.push([i, img(pick(PHOTO_POOL)), p === 0, p]);
    }
  }

  await insertRows(
    "listings",
    [
      "seller_id", "title", "description", "category_slug", "audience", "brand",
      "size", "colour", "condition", "price", "city", "status", "view_count",
      "posted_at", "expires_at", "sold_at",
    ],
    listingRows,
  );
  console.log(`[seed] inserted ${listingRows.length.toLocaleString()} listings`);

  await insertRows(
    "listing_photos",
    ["listing_id", "path", "is_primary", "position"],
    photoRows,
  );
  console.log(`[seed] inserted ${photoRows.length.toLocaleString()} photos`);

  // The planner needs fresh statistics or it will keep choosing plans that
  // suited an empty table.
  await query("ANALYZE listings");
  await query("ANALYZE listing_photos");

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[seed] done in ${seconds}s`);

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});

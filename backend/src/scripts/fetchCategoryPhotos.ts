/**
 * Downloads keyword-matched clothing photos, one set per category, into
 * uploads/images/catalog/ and records them in a manifest.
 *
 * Run with:  npm run images:catalog          (default 24 per category)
 *            npm run images:catalog -- 12    (fewer, for a quick run)
 *
 * Source is loremflickr, which serves Flickr Creative Commons photos matching
 * keywords and needs no API key. Each category asks for its own garment and
 * gender ("women,croptop") so a skirt listing gets a skirt photo and a women's
 * listing never gets a men's one.
 *
 * Relevance is best-effort: keyword matching against Flickr is looser than a
 * curated product shoot, so an occasional photo will be off-topic. Unsplash or
 * Pexels would be tighter but both require an API key.
 *
 * `lock` is loremflickr's deterministic seed — the same lock always returns the
 * same photo, which is what makes the set stable across runs and lets us skip
 * files already on disk instead of re-downloading them.
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "../config/env";

const DEFAULT_PER_CATEGORY = 24;
const OUTPUT_DIR = path.join(config.imagesDir, "catalog");
const MANIFEST = path.join(OUTPUT_DIR, "manifest.json");

/** Fetch a few extra per category, since some requests come back unusable. */
const OVERSHOOT = 6;

type CategorySource = {
  slug: string;
  audience: "Men" | "Women";
  /** loremflickr keywords, ANDed together. */
  keywords: string[];
};

const CATEGORIES: CategorySource[] = [
  // Men
  { slug: "mens-shirts", audience: "Men", keywords: ["men", "shirt"] },
  { slug: "mens-tshirts", audience: "Men", keywords: ["men", "tshirt"] },
  { slug: "mens-hoodies", audience: "Men", keywords: ["men", "hoodie"] },
  { slug: "mens-jackets", audience: "Men", keywords: ["men", "jacket"] },
  { slug: "mens-jeans", audience: "Men", keywords: ["men", "jeans"] },
  { slug: "mens-trousers", audience: "Men", keywords: ["men", "trousers"] },
  { slug: "mens-knitwear", audience: "Men", keywords: ["men", "sweater"] },
  { slug: "mens-shorts", audience: "Men", keywords: ["men", "shorts"] },
  { slug: "mens-blazers", audience: "Men", keywords: ["men", "blazer"] },
  { slug: "mens-tracksuits", audience: "Men", keywords: ["men", "tracksuit"] },

  // Women
  { slug: "womens-tops", audience: "Women", keywords: ["women", "blouse"] },
  { slug: "womens-croptops", audience: "Women", keywords: ["women", "croptop"] },
  { slug: "womens-dresses", audience: "Women", keywords: ["women", "dress"] },
  { slug: "womens-skirts", audience: "Women", keywords: ["women", "skirt"] },
  { slug: "womens-jeans", audience: "Women", keywords: ["women", "jeans"] },
  { slug: "womens-hoodies", audience: "Women", keywords: ["women", "hoodie"] },
  { slug: "womens-jackets", audience: "Women", keywords: ["women", "jacket"] },
  { slug: "womens-knitwear", audience: "Women", keywords: ["women", "cardigan"] },
  { slug: "womens-coords", audience: "Women", keywords: ["women", "jumpsuit"] },
  { slug: "womens-trousers", audience: "Women", keywords: ["women", "trousers"] },
];

export type CatalogManifestEntry = {
  file: string;
  slug: string;
  audience: "Men" | "Women";
};

/**
 * Downloads one photo. Returns the byte length written, or 0 when the response
 * was unusable — too small to be a photograph, or not an image at all. Both
 * happen occasionally and would otherwise be saved as a broken file.
 */
async function download(url: string, destination: string): Promise<number> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return 0;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return 0;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 4096) return 0;

    fs.writeFileSync(destination, buffer);
    return buffer.byteLength;
  } catch {
    return 0;
  }
}

async function main(): Promise<void> {
  const requested = Number(process.argv[2] ?? DEFAULT_PER_CATEGORY);
  const perCategory =
    Number.isFinite(requested) && requested > 0 ? requested : DEFAULT_PER_CATEGORY;

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const manifest: CatalogManifestEntry[] = [];
  let downloaded = 0;
  let reused = 0;
  let rejected = 0;

  for (const category of CATEGORIES) {
    const keywords = category.keywords.join(",");
    let kept = 0;

    for (let lock = 1; kept < perCategory && lock <= perCategory + OVERSHOOT; lock++) {
      const fileName = `${category.slug}-${lock}.jpg`;
      const destination = path.join(OUTPUT_DIR, fileName);

      if (fs.existsSync(destination) && fs.statSync(destination).size >= 4096) {
        reused++;
        kept++;
        manifest.push({
          file: `${config.imagesRoute}/catalog/${fileName}`,
          slug: category.slug,
          audience: category.audience,
        });
        continue;
      }

      const url = `https://loremflickr.com/600/800/${keywords}/all?lock=${lock}`;
      if ((await download(url, destination)) > 0) {
        downloaded++;
        kept++;
        manifest.push({
          file: `${config.imagesRoute}/catalog/${fileName}`,
          slug: category.slug,
          audience: category.audience,
        });
      } else {
        rejected++;
      }
    }

    console.log(`[catalog] ${category.slug}: ${kept} photos (${keywords})`);
  }

  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  const unique = new Set(manifest.map((entry) => entry.file)).size;
  console.log(
    `[catalog] ${downloaded} downloaded, ${reused} reused, ${rejected} rejected, ${unique} distinct photos across ${CATEGORIES.length} categories`,
  );
}

main().catch((err) => {
  console.error("[catalog] failed:", err);
  process.exit(1);
});

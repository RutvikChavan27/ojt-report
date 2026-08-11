/**
 * Downloads real clothing photography from the DummyJSON product API into
 * uploads/images/api/ and writes a manifest describing what each file shows.
 *
 * Run with:  npm run images:fetch
 *
 * Why this exists: the seed previously drew from ~45 local files with no idea
 * what garment each depicted, so a dress listing could show a shirt. Each photo
 * here arrives tagged with the category it came from, which lets the seed match
 * a listing's category to a photo that actually shows that kind of garment.
 *
 * DummyJSON is used because it needs no API key. It is also small -- about a
 * hundred distinct apparel images -- so it cannot give a unique photo to every
 * one of a hundred thousand listings. See the note in the seed script.
 *
 * Safe to re-run: files already on disk are skipped, so this is not a way to
 * hammer the upstream API.
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "../config/env";

const API = "https://dummyjson.com/products/category";
const OUTPUT_DIR = path.join(config.imagesDir, "api");
const MANIFEST = path.join(OUTPUT_DIR, "manifest.json");

/**
 * DummyJSON category -> the marketplace categories its photos suit.
 * A photo of a dress is only ever used for a dress listing.
 */
const SOURCES: { source: string; audience: "Men" | "Women"; categories: string[] }[] = [
  { source: "mens-shirts", audience: "Men", categories: ["mens-shirts"] },
  { source: "mens-shoes", audience: "Men", categories: ["mens-shoes"] },
  { source: "womens-dresses", audience: "Women", categories: ["womens-dresses"] },
  { source: "womens-shoes", audience: "Women", categories: ["womens-shoes"] },
  { source: "tops", audience: "Women", categories: ["womens-tops"] },
];

export type ImageManifestEntry = {
  /** Path as served by the API, e.g. "/images/api/mens-shirts-1-0.jpg". */
  file: string;
  source: string;
  audience: "Men" | "Women";
  categories: string[];
  title: string;
};

type DummyProduct = { id: number; title: string; images: string[] };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Downloads one image unless it is already on disk. Returns false on failure. */
async function download(url: string, destination: string): Promise<boolean> {
  if (fs.existsSync(destination)) return true;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[images] skipped ${url} -> HTTP ${res.status}`);
      return false;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    // Guard against a truncated or error-page response being written as a photo.
    if (buffer.byteLength < 1024) {
      console.warn(`[images] skipped ${url} -> only ${buffer.byteLength} bytes`);
      return false;
    }
    fs.writeFileSync(destination, buffer);
    return true;
  } catch (err) {
    console.warn(`[images] failed ${url}:`, (err as Error).message);
    return false;
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const manifest: ImageManifestEntry[] = [];
  let downloaded = 0;
  let reused = 0;

  for (const { source, audience, categories } of SOURCES) {
    const { products } = await fetchJson<{ products: DummyProduct[] }>(
      `${API}/${source}?limit=0&select=title,images`,
    );

    for (const product of products) {
      for (const [index, imageUrl] of product.images.entries()) {
        const extension = path.extname(new URL(imageUrl).pathname) || ".jpg";
        const fileName = `${source}-${product.id}-${index}${extension}`;
        const destination = path.join(OUTPUT_DIR, fileName);
        const existed = fs.existsSync(destination);

        if (await download(imageUrl, destination)) {
          if (existed) reused++;
          else downloaded++;
          manifest.push({
            file: `${config.imagesRoute}/api/${fileName}`,
            source,
            audience,
            categories,
            title: product.title,
          });
        }
      }
    }

    console.log(`[images] ${source}: ${products.length} products`);
  }

  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  const unique = new Set(manifest.map((entry) => entry.file)).size;
  console.log(
    `[images] ${downloaded} downloaded, ${reused} already present, ${unique} distinct photos`,
  );
  console.log(`[images] manifest written to ${MANIFEST}`);
}

main().catch((err) => {
  console.error("[images] failed:", err);
  process.exit(1);
});

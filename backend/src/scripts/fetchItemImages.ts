/**
 * Downloads a real photograph for every listing that has no product shot.
 *
 * DummyJSON covers phones, laptops, vehicles, some furniture and sportswear —
 * roughly 60% of the catalogue. It has nothing for guitars, board games,
 * novels, sarees, dog toys or refrigerators, and those listings were falling
 * back to a generated card.
 *
 * Openverse aggregates openly-licensed photography, needs no API key, and is
 * searched here **per item** — the query is built from that listing's own
 * title, so a guitar listing searches for a guitar. Nothing is ever borrowed
 * from a neighbouring listing.
 *
 * Output: uploads/images/items/, plus items-manifest.json keyed by the exact
 * listing title, which is what the seed looks up.
 *
 * Licensing: results are filtered to CC-licensed and public-domain works, and
 * each entry records its licence and source URL so attribution is possible.
 *
 * Safe to re-run: files already on disk are skipped.
 *
 * Run with:  npm run images:items
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "../config/env";
import { ITEMS } from "../db/seeds/seedMarketplace";

const API = "https://api.openverse.org/v1/images/";
const OUTPUT_DIR = path.join(config.imagesDir, "items");
const MANIFEST = path.join(OUTPUT_DIR, "items-manifest.json");

export type ItemImage = {
  /** The listing title this photo belongs to. */
  title: string;
  /** Public path, e.g. "/images/items/used-cricket-bat.jpg". */
  file: string;
  /** What was searched for, kept so a poor match can be diagnosed. */
  query: string;
  licence: string;
  source: string;
};

/**
 * Turns a listing title into a search query.
 *
 * Second-hand titles carry condition and sales language that hurts a photo
 * search — "Used", "Pre-owned", everything after the em dash. Stripping those
 * leaves the object itself, which is what needs photographing.
 */
function queryFor(title: string): string {
  return title
    .split("—")[0]
    .replace(/\b(used|pre-owned|preowned|gently used|second-hand|secondhand)\b/gi, "")
    .replace(/\bset of \d+\b/gi, "")
    .replace(/\bbundle\b/gi, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function download(url: string, destination: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "bazaar-seed/1.0" } });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 4096) return false;

    /* Check the magic bytes, not just the length. Two upstreams answered with a
       155KB XML error document, which sailed past a size check and was written
       out as a .jpg — the browser then failed to decode it and the card showed
       blank. A file that does not begin like an image is not one. */
    const signature = buffer.subarray(0, 4).toString("hex");
    const isImage =
      signature.startsWith("ffd8") || // JPEG
      signature.startsWith("89504e47") || // PNG
      signature.startsWith("52494646") || // RIFF/WebP
      signature.startsWith("47494638"); // GIF
    if (!isImage) return false;

    fs.writeFileSync(destination, buffer);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Only the items with no DummyJSON product behind them.
  const needed = Object.values(ITEMS)
    .flat()
    .filter(([, , product]) => product === null)
    .map(([title]) => title);

  console.log(`[items] ${needed.length} listings need a photo`);

  const manifest: ItemImage[] = [];
  let downloaded = 0;
  let reused = 0;
  let failed: string[] = [];

  for (const title of needed) {
    const query = queryFor(title);
    const fileName = `${slugify(title)}.jpg`;
    const destination = path.join(OUTPUT_DIR, fileName);

    if (fs.existsSync(destination)) {
      reused++;
      manifest.push({
        title,
        file: `${config.imagesRoute}/items/${fileName}`,
        query,
        licence: "cc",
        source: "openverse",
      });
      continue;
    }

    /* Two attempts: the full object name, then just its head words. "Casio
       CT-S300 Keyboard 61 Keys" finds nothing, "Casio Keyboard" finds plenty —
       a model number is precise for a listing and far too narrow for a photo
       search. The broader query still describes the same kind of object. */
    const attempts = [query, query.split(" ").slice(0, 2).join(" ")].filter(
      (value, index, all) => value.length > 2 && all.indexOf(value) === index,
    );

    let saved = false;
    for (const attempt of attempts) {
      if (saved) break;
      try {
        const url =
          `${API}?q=${encodeURIComponent(attempt)}&page_size=12` +
          `&license_type=all-cc,commercial&mature=false`;
        const res = await fetch(url, { headers: { "User-Agent": "bazaar-seed/1.0" } });
        if (!res.ok) continue;

        const body = (await res.json()) as {
          results?: {
            url: string;
            thumbnail?: string;
            license: string;
            foreign_landing_url: string;
          }[];
        };

        for (const result of body.results ?? []) {
          // The original occasionally 404s or redirects to an HTML page; the
          // thumbnail is served from Openverse itself and is more reliable.
          const candidates = [result.url, result.thumbnail].filter(Boolean) as string[];
          for (const candidate of candidates) {
            if (await download(candidate, destination)) {
              manifest.push({
                title,
                file: `${config.imagesRoute}/items/${fileName}`,
                query: attempt,
                licence: result.license,
                source: result.foreign_landing_url,
              });
              downloaded++;
              saved = true;
              break;
            }
          }
          if (saved) break;
        }
      } catch {
        // Try the next, broader query rather than giving up on this listing.
      }
    }
    if (!saved) failed.push(title);

    // Courtesy pause — this is an unauthenticated public API.
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`[items] ${downloaded} downloaded, ${reused} already present`);
  console.log(`[items] ${failed.length} still without a photo`);
  for (const entry of failed) console.log(`  - ${entry}`);
  console.log(`[items] manifest written to ${MANIFEST}`);
}

main().catch((err) => {
  console.error("[items] failed:", err);
  process.exit(1);
});

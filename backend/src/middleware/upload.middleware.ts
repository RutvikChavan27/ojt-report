/**
 * Photo uploads for listings.
 *
 * Files are written straight to the folder the app already serves at
 * `config.imagesRoute`, so an uploaded photo is reachable at the same kind of
 * `/images/...` path as every seeded one and nothing downstream needs to know
 * where a given image came from.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { config } from "../config/env";

/** The brief allows eight photos per listing; the API is the thing enforcing it. */
export const MAX_PHOTOS_PER_LISTING = 8;

/** Per-file ceiling. Large enough for a phone photo, small enough to refuse a video. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * Accepted types, and the extension each is stored with.
 *
 * Whitelisted by MIME type rather than by the name the client sent: the
 * extension is chosen here from the type, so "shell.php" cannot be uploaded and
 * later served as anything but an image.
 */
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

/** True when uploads belong in Supabase Storage rather than on local disk. */
const useSupabaseStorage = config.imageStorage === "supabase";

/**
 * Random, never the client's filename: two people uploading "photo.jpg" must
 * not collide, and a caller must not get to choose a path on disk.
 */
const storedNameFor = (mimetype: string): string =>
  `${crypto.randomBytes(16).toString("hex")}${ALLOWED_TYPES[mimetype] ?? ".jpg"}`;

// Multer will not create the destination itself, and a fresh clone has no
// uploads folder until something is seeded into it. Only needed on disk.
if (!useSupabaseStorage) fs.mkdirSync(config.imagesDir, { recursive: true });

// In Supabase mode the bytes are held in memory just long enough to forward to
// Storage. A deployed backend's filesystem is ephemeral, so writing there would
// produce photos that vanish on the next restart.
const storage = useSupabaseStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, done) => done(null, config.imagesDir),
      filename: (_req, file, done) => done(null, storedNameFor(file.mimetype)),
    });

export const uploadListingPhotos = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_PHOTOS_PER_LISTING },
  fileFilter: (_req, file, done) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      done(new Error("Only JPEG, PNG, WebP and AVIF images can be uploaded."));
      return;
    }
    done(null, true);
  },
}).array("photos", MAX_PHOTOS_PER_LISTING);

/** The public path a stored file is served from. */
export const publicPathFor = (filename: string): string =>
  `${config.imagesRoute}/${path.basename(filename)}`;

/**
 * Puts freshly uploaded files where they will still be readable later, and
 * returns the `/images/...` paths to store in `listing_photos.path`.
 *
 * On disk that is a no-op — multer has already written them. In Supabase mode
 * each buffer is PUT into the bucket first. Either way the caller gets the same
 * shape of path, so nothing downstream knows which backend is in use.
 *
 * @throws Error if Storage rejects an upload, so the request fails loudly
 *         rather than recording a row pointing at a file that does not exist.
 */
export async function persistUploads(
  files: Express.Multer.File[]
): Promise<string[]> {
  if (!useSupabaseStorage) return files.map((f) => publicPathFor(f.filename));

  return Promise.all(
    files.map(async (file) => {
      const name = storedNameFor(file.mimetype);
      const res = await fetch(
        `${config.supabaseUrl}/storage/v1/object/${config.storageBucket}/${name}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
            apikey: config.supabaseServiceRoleKey,
            "Content-Type": file.mimetype,
          },
          body: new Uint8Array(file.buffer),
        }
      );
      if (!res.ok) {
        throw new Error(
          `Storage upload failed (${res.status}): ${await res.text()}`
        );
      }
      return publicPathFor(name);
    })
  );
}

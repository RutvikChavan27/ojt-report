import type { Request, Response, NextFunction } from "express";
import {
  getDashboard,
  getListing,
  listListingCategories,
  listListings,
} from "../services/marketplace.service";
import {
  searchListings,
  suggestSearches,
} from "../services/listingSearch.service";
import { parseSearchRequest } from "../validators/listingSearch.validator";
import { persistUploads, uploadListingPhotos } from "../middleware/upload.middleware";
import { sendError, sendSuccess } from "../utils/response";
import type { UploadedImageDTO } from "../types/dto";

const AUDIENCES = new Set(["Men", "Women", "Unisex"]);

/** Only pass through a value the enum will accept; anything else means "all". */
function parseAudience(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalised = `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`;
  return AUDIENCES.has(normalised) ? normalised : undefined;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** GET /api/dashboard — everything the homepage renders, in one call. */
export async function getDashboardData(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await getDashboard());
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/listings/images — stores photos and returns their public paths.
 *
 * Upload is its own step, before any listing exists: the Post Ad form needs to
 * show thumbnails while it is still being filled in, and a half-written form
 * must not create a listing row. The returned paths are what a later
 * create/update call attaches to a listing.
 *
 * Behind requireAuth, so anonymous callers cannot fill the disk.
 */
export function postListingImages(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  uploadListingPhotos(req, res, (err: unknown) => {
    if (err) {
      // Multer's own errors are size/count limits and the type filter above —
      // all of them are the caller's mistake, so they are 400s with the reason.
      sendError(res, 400, err instanceof Error ? err.message : "Upload failed.");
      return;
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      sendError(res, 400, "Attach at least one photo.");
      return;
    }

    // persistUploads is async in Supabase mode (it PUTs each buffer to the
    // bucket), so a rejection goes to next() rather than being left unhandled.
    persistUploads(files)
      .then((paths) => {
        const images: UploadedImageDTO[] = paths.map((path) => ({ path }));
        sendSuccess(res, { images }, 201);
      })
      .catch(next);
  });
}

/** GET /api/listings?category=&audience=&page=&perPage= */
export async function getListings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;

    const result = await listListings({
      categorySlug: category || undefined,
      audience: parseAudience(req.query.audience),
      page: parsePositiveInt(req.query.page, 1),
      perPage: parsePositiveInt(req.query.perPage, 24),
    });

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/** GET /api/listings/:id */
export async function getListingById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Reject anything that is not a plain integer before it reaches the query,
    // so a bad id is a 404 rather than a database error.
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (typeof rawId !== "string" || !/^\d+$/.test(rawId)) {
      sendError(res, 404, "Listing not found");
      return;
    }

    const listing = await getListing(rawId);
    if (!listing) {
      sendError(res, 404, "Listing not found");
      return;
    }

    sendSuccess(res, listing);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/search/listings
 *
 * Query params: q, category, audience, city, condition (repeatable), minPrice,
 * maxPrice, postedWithin (days), sort (relevance|newest|price_asc|price_desc),
 * page, perPage.
 */
export async function getListingSearch(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const results = await searchListings(parseSearchRequest(req.query));
    sendSuccess(res, results);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/search/suggest?q=bicy&limit=6 — type-ahead suggestions.
 *
 * Open, like the rest of search. Answers an empty list rather than a 400 for a
 * too-short query: the box calls this while someone types, and "you have not
 * typed enough yet" is a normal state, not a client error.
 */
export async function getSearchSuggestions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const rawLimit = Number(req.query.limit);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : undefined;

    sendSuccess(res, await suggestSearches(q, limit));
  } catch (err) {
    next(err);
  }
}

/** GET /api/listing-categories?audience=Men|Women */
export async function getListingCategories(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await listListingCategories(parseAudience(req.query.audience));
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}

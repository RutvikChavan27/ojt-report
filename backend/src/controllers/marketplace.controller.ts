import type { Request, Response, NextFunction } from "express";
import {
  getListing,
  listListingCategories,
  listListings,
} from "../services/marketplace.service";
import { sendError, sendSuccess } from "../utils/response";

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

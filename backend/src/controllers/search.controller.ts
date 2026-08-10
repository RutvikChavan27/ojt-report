import type { Request, Response, NextFunction } from "express";
import { searchProducts } from "../services/search.service";
import { parseSearchQuery } from "../validators/search.validator";
import { sendError, sendSuccess } from "../utils/response";

/** GET /api/search?q=denim+jacket&gender=Men|Women */
export async function getSearchResults(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = parseSearchQuery(req.query);
    if (!parsed) {
      sendError(res, 400, "Query parameter 'q' is required");
      return;
    }

    const results = await searchProducts(parsed.q, parsed.gender);
    sendSuccess(res, results);
  } catch (err) {
    next(err);
  }
}

import type { Request, Response, NextFunction } from "express";
import { findCategories, findHeroLooks } from "../services/catalog.service";
import { parseGender } from "../utils/gender";
import { sendSuccess } from "../utils/response";

/** GET /api/categories?gender=Men|Women */
export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gender = parseGender(req.query.gender);
    const categories = await findCategories(gender);
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}

/** GET /api/hero-looks?gender=Men|Women */
export async function getHeroLooks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gender = parseGender(req.query.gender);
    const heroLooks = await findHeroLooks(gender);
    sendSuccess(res, heroLooks);
  } catch (err) {
    next(err);
  }
}

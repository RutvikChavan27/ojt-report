import type { Request, Response, NextFunction } from "express";
import { findProducts } from "../services/listing.service";
import { parseGender } from "../utils/gender";
import { sendSuccess } from "../utils/response";

/** GET /api/products?gender=Men|Women */
export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gender = parseGender(req.query.gender);
    const products = await findProducts(gender);
    sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
}

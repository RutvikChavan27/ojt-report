import type { Request, Response, NextFunction } from "express";
import { getDashboard } from "../services/dashboard.service";
import { parseGender } from "../utils/gender";
import { sendSuccess } from "../utils/response";

/** GET /api/dashboard?gender=Men|Women — everything the home page needs at once. */
export async function getDashboardData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gender = parseGender(req.query.gender);
    const dashboard = await getDashboard(gender);
    sendSuccess(res, dashboard);
  } catch (err) {
    next(err);
  }
}

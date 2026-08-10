import type { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";

/** 404 handler for unmatched routes. */
export function notFound(req: Request, res: Response): void {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

/** Central error handler — keeps controllers free of response boilerplate. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("[error]", err);
  sendError(res, 500, message);
}

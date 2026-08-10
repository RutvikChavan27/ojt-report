import "dotenv/config";
import path from "node:path";

/**
 * Centralised, typed access to environment configuration.
 * Reads once at startup so the rest of the app never touches process.env directly.
 */
export const config = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/thread",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  /** Folder on disk where listing/category/hero images live and are served from. */
  imagesDir: path.resolve(process.cwd(), "uploads", "images"),
  /** Public URL path the images are exposed under (stored paths begin with this). */
  imagesRoute: "/images",
};

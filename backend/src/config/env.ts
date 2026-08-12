import "dotenv/config";
import path from "node:path";

/**
 * Centralised, typed access to environment configuration.
 * Reads once at startup so the rest of the app never touches process.env directly.
 */
export const config = {
  port: Number(process.env.PORT ?? 5000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:5432/thread",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  /**
   * Signs the session cookie. The development fallback exists so the app runs
   * out of the box; `npm start` refuses to boot without a real value set.
   */
  sessionSecret: process.env.SESSION_SECRET ?? "dev-only-insecure-session-secret",
  isProduction: process.env.NODE_ENV === "production",
  /** Google OAuth. Empty means the Google routes report themselves unavailable. */
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ??
    "http://localhost:5000/api/auth/google/callback",
  /** Folder on disk where listing/category/hero images live and are served from. */
  imagesDir: path.resolve(process.cwd(), "uploads", "images"),
  /** Public URL path the images are exposed under (stored paths begin with this). */
  imagesRoute: "/images",
};

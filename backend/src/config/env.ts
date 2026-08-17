import "dotenv/config";
import path from "node:path";

/**
 * Reads a required variable, throwing at import time when it is missing.
 * Used for settings that have no safe default — currently the database URL.
 *
 * @throws Error naming the variable, so the failure says what to set rather
 *         than surfacing later as an opaque connection error.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy backend/.env.example to backend/.env and fill it in.`
    );
  }
  return value;
}

/**
 * Centralised, typed access to environment configuration.
 * Reads once at startup so the rest of the app never touches process.env directly.
 */
export const config = {
  port: Number(process.env.PORT ?? 5000),
  /**
   * Required. There is deliberately no fallback: the database now lives in
   * Supabase, and a default pointing at localhost would let a misconfigured
   * deployment start up and quietly read an empty local database instead of
   * failing where the mistake is visible.
   */
  databaseUrl: requireEnv("DATABASE_URL"),
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

  /* ---- Image storage -------------------------------------------------- */
  /**
   * Where the image bytes actually live.
   *
   * `listing_photos.path` stays in its `/images/...` form either way — it is a
   * logical path, not a filesystem one. That keeps the stored rows portable and
   * means the React app needs no knowledge of where files are hosted. Only this
   * setting decides whether `/images/*` is read off local disk or redirected to
   * the Supabase Storage bucket.
   *
   * Defaults to `supabase` once SUPABASE_URL is configured, because a deployed
   * backend has no `uploads/` folder and serving from disk there yields 404s.
   */
  imageStorage: (process.env.IMAGE_STORAGE ??
    (process.env.SUPABASE_URL ? "supabase" : "local")) as "local" | "supabase",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  /** Public (unauthenticated) base for the bucket holding listing photos. */
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "listing-photos",
  /**
   * Writes to Storage. Bypasses row-level security, so it must never reach the
   * client — it is read here and used only by server-side upload code.
   */
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};

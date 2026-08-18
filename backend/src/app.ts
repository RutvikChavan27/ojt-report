import express from "express";
import cors from "cors";
import { config } from "./config/env";
import apiRouter from "./routes/index";
import authRouter from "./routes/auth.routes";
import { buildSessionMiddleware } from "./middleware/session.middleware";
import { errorHandler, notFound } from "./middleware/error.middleware";

/** Loopback and RFC1918 ranges — a machine on the developer's own network. */
const LOCAL_HOSTNAME =
  /^(localhost|127\.0\.0\.1|\[::1\]|::1|0\.0\.0\.0|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/;

/**
 * Whether a browser origin may call this API with credentials.
 *
 * Production is strict: only what CLIENT_URL names.
 *
 * Development also accepts any loopback or private-network origin on any port.
 * The dev frontend legitimately appears on several — 5173, 4173, `localhost` vs
 * `127.0.0.1`, and the LAN address Vite prints for testing on a phone — and each
 * is a distinct origin to a browser. Enumerating them was a losing game: the
 * failure is a refused request, which the browser reports identically to the
 * server being down, so a missing entry costs far more time to diagnose than the
 * permissiveness is worth on a local machine.
 *
 * Not a wildcard even so. `credentials: true` with `*` is rejected by browsers,
 * and the session depends on the cookie, so the origin has to be reflected back.
 */
function isAllowedOrigin(origin: string | undefined): boolean {
  // No Origin header: same-origin navigations, curl, server-to-server.
  if (!origin) return true;
  if (config.clientUrls.includes(origin)) return true;
  if (config.isProduction) return false;

  try {
    return LOCAL_HOSTNAME.test(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/** Builds the Express app (no listening / no DB — kept pure for testing). */
export function createApp() {
  const app = express();

  // `credentials` and an explicit (reflected) origin are both required for the
  // session cookie to survive a cross-origin request: browsers refuse to send
  // cookies to a wildcard origin.
  app.use(
    cors({
      origin: (origin, done) => done(null, isAllowedOrigin(origin)),
      credentials: true,
    })
  );
  app.use(express.json());

  // Session cookie is signed, so the app has to know it is behind a proxy in
  // production or `secure: true` cookies are dropped.
  if (config.isProduction) app.set("trust proxy", 1);
  app.use(buildSessionMiddleware());

  // Serve listing/category/hero images. A row stored as "/images/foo.jpg"
  // resolves to <imagesDir>/foo.jpg locally, or to the same key inside the
  // Supabase Storage bucket once the app is deployed.
  //
  // The Supabase branch answers 302 rather than streaming the bytes back: the
  // browser then pulls the file straight from Supabase's CDN, so image traffic
  // never occupies an API process. Redirecting (instead of rewriting the stored
  // paths) also keeps `listing_photos.path` provider-agnostic — moving hosts
  // again is a config change, not a data migration.
  if (config.imageStorage === "supabase") {
    const bucketBase = `${config.supabaseUrl}/storage/v1/object/public/${config.storageBucket}`;
    app.use(config.imagesRoute, (req, res) => {
      // Mounted at /images, so req.path is the remainder, e.g. "/api/foo.webp".
      res.redirect(302, `${bucketBase}${req.path}`);
    });
  } else {
    app.use(config.imagesRoute, express.static(config.imagesDir));
  }

  app.get("/health", (_req, res) => {
    res.json({ success: true, status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

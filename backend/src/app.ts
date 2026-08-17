import express from "express";
import cors from "cors";
import { config } from "./config/env";
import apiRouter from "./routes/index";
import authRouter from "./routes/auth.routes";
import { buildSessionMiddleware } from "./middleware/session.middleware";
import { errorHandler, notFound } from "./middleware/error.middleware";

/** Builds the Express app (no listening / no DB — kept pure for testing). */
export function createApp() {
  const app = express();

  // `credentials` and a single explicit origin are both required for the session
  // cookie to survive a cross-origin request: browsers refuse to send cookies to
  // a wildcard origin.
  app.use(cors({ origin: config.clientUrl, credentials: true }));
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

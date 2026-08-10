import express from "express";
import cors from "cors";
import { config } from "./config/env";
import apiRouter from "./routes/index";
import { errorHandler, notFound } from "./middleware/error.middleware";

/** Builds the Express app (no listening / no DB — kept pure for testing). */
export function createApp() {
  const app = express();

  app.use(cors({ origin: config.clientUrl }));
  app.use(express.json());

  // Serve listing/category/hero images straight from disk.
  // A product stored with image "/images/foo.jpg" resolves to <imagesDir>/foo.jpg.
  app.use(config.imagesRoute, express.static(config.imagesDir));

  app.get("/health", (_req, res) => {
    res.json({ success: true, status: "ok" });
  });

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

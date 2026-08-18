/**
 * Session setup. Sessions live in Postgres rather than in memory, so they
 * survive a server restart and a logout can actually delete one — an in-memory
 * store would drop every login on each `tsx watch` reload.
 */
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { RequestHandler } from "express";
import { config } from "../config/env";
import { getPool } from "../config/database";

/** Fields this app stores on a session. */
declare module "express-session" {
  interface SessionData {
    userId?: number;
    /** Anti-CSRF value for an in-flight OAuth round trip. */
    oauthState?: string;
  }
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function buildSessionMiddleware(): RequestHandler {
  const PgStore = connectPgSimple(session);

  return session({
    name: "bazaar.sid",
    secret: config.sessionSecret,
    store: new PgStore({
      /* Share the app's pool rather than handing the store a connection string.
         Given one, connect-pg-simple builds a second pool of its own — unwarmed,
         and separate from the one startup pre-opens — so a session read on an
         otherwise idle server paid a fresh TLS handshake to the database. That
         put seconds onto requests whose own query took milliseconds. Sessions
         are touched on nearly every request, so this is the pool that most
         needed to be warm. */
      pool: getPool(),
      tableName: "user_sessions",
      // Created by the migration; this only guards a fresh database.
      createTableIfMissing: true,
      // Sweep expired rows periodically so the table does not grow forever.
      pruneSessionInterval: 60 * 15,
    }),
    // Nothing is stored against anonymous visitors, so there is no reason to
    // write a row (or set a cookie) until something is actually kept.
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true, // unreadable from JavaScript, so XSS cannot lift it
      sameSite: "lax", // survives the Google redirect back to us
      secure: config.isProduction, // HTTPS-only once deployed
      maxAge: SEVEN_DAYS_MS,
    },
  });
}

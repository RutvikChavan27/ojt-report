import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { config } from "../config/env";
import { AuthError, login, register, signInWithGoogle } from "../services/auth.service";
import {
  buildAuthoriseUrl,
  fetchGoogleProfile,
  GoogleAuthError,
  isGoogleConfigured,
} from "../services/google.service";
import { findUserById } from "../repositories/user.repository";
import { parseCredentials, parseRegistration } from "../validators/auth.validator";
import { sendError, sendSuccess } from "../utils/response";

/**
 * Starts a fresh session for a user id.
 *
 * The session is regenerated on every successful sign-in so the pre-login
 * session identifier cannot be reused afterwards (session fixation).
 */
function startSession(req: Request, userId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) return reject(regenerateError);
      req.session.userId = userId;
      req.session.save((saveError) =>
        saveError ? reject(saveError) : resolve(),
      );
    });
  });
}

/** POST /api/auth/register */
export async function postRegister(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = parseRegistration(req.body);
    if ("error" in parsed) {
      sendError(res, 400, parsed.error);
      return;
    }

    const user = await register(parsed.value);
    await startSession(req, user.id);
    sendSuccess(res, user, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      sendError(res, err.status, err.message);
      return;
    }
    next(err);
  }
}

/** POST /api/auth/login */
export async function postLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = parseCredentials(req.body);
    if ("error" in parsed) {
      sendError(res, 400, parsed.error);
      return;
    }

    const user = await login(parsed.value);
    await startSession(req, user.id);
    sendSuccess(res, user);
  } catch (err) {
    if (err instanceof AuthError) {
      sendError(res, err.status, err.message);
      return;
    }
    next(err);
  }
}

/**
 * POST /api/auth/logout
 *
 * Destroys the session server-side as well as clearing the cookie, so a copied
 * cookie is useless afterwards — clearing the cookie alone would leave the
 * session row valid.
 */
export function postLogout(req: Request, res: Response, next: NextFunction): void {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("bazaar.sid");
    sendSuccess(res, { loggedOut: true });
  });
}

/**
 * GET /api/auth/me
 *
 * Returns the signed-in user or null. Null is a 200, not a 401: "nobody is
 * signed in" is a normal answer for the page load that asks this.
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.session.userId;
    if (!userId) {
      sendSuccess(res, null);
      return;
    }

    const user = await findUserById(userId);
    if (!user) {
      // The account was deleted while the session lived on.
      req.session.destroy(() => undefined);
      sendSuccess(res, null);
      return;
    }

    sendSuccess(res, { id: user.id, email: user.email, name: user.display_name });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/google — redirects the browser to Google's consent screen. */
export function getGoogleStart(req: Request, res: Response): void {
  if (!isGoogleConfigured()) {
    sendError(
      res,
      503,
      "Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    );
    return;
  }

  // Held in the session so the value returned by Google can be compared to the
  // one this browser was actually issued.
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;
  req.session.save(() => res.redirect(buildAuthoriseUrl(state)));
}

/**
 * GET /api/auth/google/callback
 *
 * Google sends the browser here, so the responses are redirects back into the
 * frontend rather than JSON — with ?auth=google_failed on failure so the UI can
 * say something useful.
 */
export async function getGoogleCallback(
  req: Request,
  res: Response,
): Promise<void> {
  // `detail` is Google's own short error code (invalid_client, invalid_grant,
  // ...) — safe to hand to the client since it's a fixed OAuth error keyword,
  // never a stack trace or anything else that could leak internals.
  const fail = (reason: string, detail?: string) =>
    res.redirect(
      `${config.clientUrl}/?auth=${encodeURIComponent(reason)}` +
        (detail ? `&reason=${encodeURIComponent(detail)}` : ""),
    );

  if (!isGoogleConfigured()) return fail("google_unconfigured");

  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  const expectedState = req.session.oauthState;

  // Consume the state either way, so a value cannot be replayed.
  req.session.oauthState = undefined;

  if (req.query.error) return fail("google_denied");
  if (!code || !state || !expectedState || state !== expectedState) {
    return fail("google_state_mismatch");
  }

  try {
    const profile = await fetchGoogleProfile(code);
    const user = await signInWithGoogle(profile);
    await startSession(req, user.id);
    // Straight to the main browsing page rather than the logged-out Welcome
    // screen — that page's whole point is "log in or create an account",
    // which is exactly what someone who just did either doesn't need to see.
    res.redirect(`${config.clientUrl}/home?auth=google_ok`);
  } catch (err) {
    console.error("[auth] Google sign-in failed:", (err as Error).message);
    fail("google_failed", err instanceof GoogleAuthError ? err.code : undefined);
  }
}

/** GET /api/auth/providers — lets the UI hide a button that cannot work. */
export function getAuthProviders(_req: Request, res: Response): void {
  sendSuccess(res, { google: isGoogleConfigured() });
}

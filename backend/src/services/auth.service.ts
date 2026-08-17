/**
 * Authentication: registration, password login, and Google sign-in.
 *
 * Every function here returns a plain user object with no hash in it, so a
 * password hash cannot reach a response body by accident.
 */
import {
  createUser,
  findUserByEmail,
  findUserByProviderIdentity,
  linkProviderIdentity,
  UNIQUE_VIOLATION,
  type UserRow,
} from "../repositories/user.repository";
import { hashPassword, verifyPassword } from "../utils/password";
import type { AuthUserDTO } from "../types/dto";

/** Raised for conditions the caller should turn into a 4xx response. */
export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * The single message used for every failed password login.
 *
 * Deliberately identical whether the email is unknown, the password is wrong, or
 * the account has no local password because it was created through Google.
 * Distinguishing them would let anyone test which email addresses are
 * registered.
 */
const BAD_CREDENTIALS = "Incorrect email or password.";

const toDTO = (row: UserRow): AuthUserDTO => ({
  id: row.id,
  email: row.email,
  name: row.display_name,
});

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthUserDTO> {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await createUser({
      email: input.email,
      displayName: input.name,
      passwordHash,
    });
    return toDTO(user);
  } catch (err) {
    // Let the unique constraint be the arbiter of duplicates rather than a
    // prior SELECT, which two concurrent signups could both pass.
    if ((err as { code?: string }).code === UNIQUE_VIOLATION) {
      throw new AuthError("An account with that email already exists.", 409);
    }
    throw err;
  }
}

/**
 * Verifies credentials.
 *
 * One account system, so there is one way in: no account kinds, no per-door
 * rules. What a signed-in person may do is decided per action — posting needs
 * only an account, and editing a listing needs to own it.
 */
export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthUserDTO> {
  const user = await findUserByEmail(input.email);

  // Hash a throwaway value when the email is unknown so both paths take a
  // similar amount of time; returning instantly on a missing row leaks which
  // addresses exist through response timing.
  if (!user) {
    await verifyPassword(input.password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");
    throw new AuthError(BAD_CREDENTIALS, 401);
  }

  if (!(await verifyPassword(input.password, user.password_hash))) {
    throw new AuthError(BAD_CREDENTIALS, 401);
  }

  return toDTO(user);
}

/**
 * Resolves a Google profile to an account, creating one only when needed.
 *
 * Three cases, in order:
 *  1. This Google identity is already linked — sign that user in.
 *  2. No identity, but the email matches an existing account — link Google to
 *     it, so signing up with a password and later using Google resolves to one
 *     account rather than two.
 *  3. Neither — create the account and link the identity.
 */
export async function signInWithGoogle(profile: {
  providerUserId: string;
  email: string;
  name: string;
}): Promise<AuthUserDTO> {
  const linked = await findUserByProviderIdentity("google", profile.providerUserId);
  if (linked) return toDTO(linked);

  const existing = await findUserByEmail(profile.email);
  if (existing) {
    await linkProviderIdentity({
      userId: existing.id,
      provider: "google",
      providerUserId: profile.providerUserId,
    });
    return toDTO(existing);
  }

  // password_hash stays null: there is no local password to verify against.
  const created = await createUser({
    email: profile.email,
    displayName: profile.name,
    passwordHash: null,
  });
  await linkProviderIdentity({
    userId: created.id,
    provider: "google",
    providerUserId: profile.providerUserId,
  });
  return toDTO(created);
}

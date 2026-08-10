import type { Gender } from "../types/dto";

/**
 * Validates the ?gender= query param. Returns the normalised Gender,
 * or undefined when absent/invalid so callers can decide the fallback.
 */
export function parseGender(value: unknown): Gender | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "men") return "Men";
  if (normalized === "women") return "Women";
  return undefined;
}

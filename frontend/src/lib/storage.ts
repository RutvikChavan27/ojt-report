/**
 * Small localStorage helpers for state that must outlive the page.
 *
 * The bag and wishlist were React state only, so a refresh, a back-button
 * navigation, or a crash emptied them — a shopper losing their bag by pressing
 * back is the kind of thing that loses the sale.
 *
 * Every access is wrapped: localStorage throws in private-mode Safari and when
 * the quota is full, and a corrupt value should not take the whole app down with
 * it. Failing here means "start empty", never "crash".
 */

/** Bumping the suffix retires old shapes instead of trying to migrate them. */
export const STORAGE_KEYS = {
  cart: "bazaar.cart.v1",
  wishlist: "bazaar.wishlist.v1",
} as const;

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Out of quota or storage blocked: the app keeps working, it just will not
    // remember this across reloads.
  }
}

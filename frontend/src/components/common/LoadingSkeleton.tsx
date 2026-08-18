/**
 * Backwards-compatible alias.
 *
 * The card placeholder now lives in `ListingCardSkeleton`, alongside the rest
 * of the loading system, and is built from the shared `Skeleton` primitive.
 * This re-export keeps existing imports (`common/LoadingSkeleton`) valid so
 * nothing had to change at the call sites just to rename a file.
 */
export { default } from "./ListingCardSkeleton";

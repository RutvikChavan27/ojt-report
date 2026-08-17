/**
 * Placeholder shaped like a ListingCard.
 *
 * Matches the real card's proportions so the grid does not jump when results
 * arrive — a skeleton of the wrong height is worse than no skeleton.
 */
function LoadingSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="aspect-[4/3] w-full animate-pulse bg-gray-200" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default LoadingSkeleton;

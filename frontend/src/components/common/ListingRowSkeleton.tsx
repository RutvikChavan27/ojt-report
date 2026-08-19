import Skeleton from "./Skeleton";

/**
 * Placeholder shaped like a row on the seller dashboard (MyListings).
 *
 * Those rows are horizontal — a fixed thumbnail beside a stack of title, price
 * and metadata, with an actions bar underneath — so a card-shaped skeleton
 * would misrepresent them. This mirrors the real row's structure and its
 * `sm:flex-row` switch, so the placeholder occupies the same space the listing
 * will.
 */
function ListingRowSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-taupe bg-gradient-to-br from-cyan-50 to-mint-50">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <Skeleton
          rounded="xl"
          className="h-28 w-full flex-shrink-0 sm:w-40"
        />

        <div className="min-w-0 flex-1 space-y-3 py-1">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton rounded="full" className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-1/4" />
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-taupe px-4 py-3">
        <Skeleton rounded="full" className="h-7 w-20" />
        <Skeleton rounded="full" className="h-7 w-28" />
        <Skeleton rounded="full" className="h-7 w-20" />
      </div>
    </div>
  );
}

export default ListingRowSkeleton;

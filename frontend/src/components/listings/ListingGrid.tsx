import ListingCard from "./ListingCard";
import LoadingSkeleton from "../common/LoadingSkeleton";
import type { ListingCardData } from "../../lib/api";

type ListingGridProps = {
  listings: ListingCardData[];
  loading?: boolean;
  /** How many skeletons to show while loading. */
  skeletonCount?: number;
};

/**
 * The responsive grid every listing collection uses — two columns on a phone up
 * to four on a wide screen. Kept in one place so the homepage, search results
 * and category pages cannot drift apart.
 */
function ListingGrid({
  listings,
  loading = false,
  skeletonCount = 8,
}: ListingGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {loading
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <LoadingSkeleton key={index} />
          ))
        : listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
    </div>
  );
}

export default ListingGrid;

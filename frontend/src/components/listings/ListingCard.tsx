import { Link } from "react-router-dom";
import { FiHeart, FiMapPin } from "react-icons/fi";
import { formatPrice, placeLabel, relativeTime } from "../../lib/format";
import type { ListingCardData } from "../../lib/api";
import { useSavedListings } from "../../store/SavedListingsContext";

type ListingCardProps = {
  listing: ListingCardData;
};

/**
 * One listing in a grid.
 *
 * A classifieds card, not a product card: it leads with price, then condition
 * and where the item is, because those are what decide whether a listing is
 * worth opening. There is no cart, quantity or buy action — the next step is
 * always "view the listing and contact the seller".
 */
function ListingCard({ listing }: ListingCardProps) {
  const { isSaved, toggle } = useSavedListings();
  const saved = isSaved(listing.id);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-gray-400">
      <Link to={`/listing/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          <img
            src={listing.image}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-900">
            {listing.condition}
          </span>
        </div>

        <div className="p-3">
          <p className="text-base font-black tracking-tight text-gray-900">
            {formatPrice(listing.price)}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-[2.4em] text-sm leading-snug text-gray-700">
            {listing.title}
          </h3>

          <p className="mt-2 text-[11px] uppercase tracking-wide text-gray-400">
            {listing.categoryLabel}
          </p>

          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-gray-500">
            <span className="flex min-w-0 items-center gap-1">
              <FiMapPin size={10} className="flex-shrink-0" />
              <span className="truncate">
                {placeLabel(listing.location, listing.city)}
              </span>
            </span>
            <span className="flex-shrink-0">{relativeTime(listing.postedAt)}</span>
          </div>
        </div>
      </Link>

      {/* Outside the Link, so saving never navigates by accident */}
      <button
        type="button"
        onClick={() => toggle(listing.id)}
        aria-label={saved ? "Remove from saved" : "Save this listing"}
        aria-pressed={saved}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-900 transition hover:scale-105"
      >
        <FiHeart size={14} fill={saved ? "currentColor" : "none"} />
      </button>
    </article>
  );
}

export default ListingCard;

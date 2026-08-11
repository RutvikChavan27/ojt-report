import { FiHeart, FiMapPin } from "react-icons/fi";
import type { Listing } from "../../lib/api";
import { useWishlist } from "../../store/WishlistContext";

type ListingCardProps = {
  listing: Listing;
  onSelect?: (listing: Listing) => void;
};

/**
 * One listing in a results grid. Second-hand items lead with condition and city
 * rather than a discount, since there is no "was" price on a used garment.
 */
function ListingCard({ listing, onSelect }: ListingCardProps) {
  const { isWishlisted: checkWishlisted, toggle } = useWishlist();
  const wishlisted = checkWishlisted(listing.id);

  return (
    <div className="group">
      <button
        type="button"
        onClick={() => onSelect?.(listing)}
        aria-label={`View ${listing.title}`}
        className="relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-100 text-left"
      >
        <img
          src={listing.image}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-gray-900">
          {listing.condition}
        </span>
      </button>

      <button
        type="button"
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wishlisted}
        onClick={() =>
          toggle({
            id: listing.id,
            name: listing.title,
            image: listing.image,
            category: listing.categoryLabel,
            price: listing.price,
          })
        }
        className="relative float-right -mt-[3.25rem] mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm transition hover:scale-105"
      >
        <FiHeart size={15} fill={wishlisted ? "currentColor" : "none"} />
      </button>

      <div className="mt-3">
        <p className="text-xs text-gray-400">
          {listing.brand ?? listing.categoryLabel}
          {listing.size ? ` · ${listing.size}` : ""}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-gray-900">
          {listing.title}
        </h3>
        <p className="mt-1 text-base font-bold text-gray-900">
          ₹{listing.price.toLocaleString("en-IN")}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
          <FiMapPin size={11} />
          {listing.city}
        </p>
      </div>
    </div>
  );
}

export default ListingCard;

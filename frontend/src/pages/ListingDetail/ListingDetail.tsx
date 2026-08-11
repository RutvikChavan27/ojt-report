import { useState } from "react";
import {
  FiArrowLeft,
  FiChevronRight,
  FiHeart,
  FiMapPin,
  FiShield,
} from "react-icons/fi";
import { fetchListing } from "../../lib/api";
import { useApi } from "../../hooks/useApi";
import { useWishlist } from "../../store/WishlistContext";

type ListingDetailProps = {
  listingId: string;
  onBack: () => void;
};

const QUANTITY_OPTIONS = [1, 2, 3];

/**
 * A single marketplace listing. Unlike the storefront product page there is no
 * "was" price or size picker: a second-hand item is one garment in one size, so
 * the size is stated rather than chosen.
 */
function ListingDetail({ listingId, onBack }: ListingDetailProps) {
  const { isWishlisted: checkWishlisted, toggle } = useWishlist();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: listing, loading, error } = useApi(
    () => fetchListing(listingId),
    [listingId],
  );

  const handleAddToCart = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <section className="pb-20 pt-8">
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-10 lg:px-16">
          <div className="flex flex-col gap-10 lg:flex-row">
            <div className="aspect-[3/4] w-full animate-pulse rounded-3xl bg-gray-200 lg:w-1/2" />
            <div className="flex-1 space-y-4">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
              <div className="h-12 w-full animate-pulse rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !listing) {
    return (
      <section className="pb-20 pt-8">
        <div className="mx-auto w-full max-w-5xl px-6 text-center sm:px-10 lg:px-16">
          <p className="text-sm text-gray-500">
            {error ?? "That listing is no longer available."}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-black/5"
          >
            Go back
          </button>
        </div>
      </section>
    );
  }

  const wishlisted = checkWishlisted(listing.id);
  const images = listing.images.length > 0 ? listing.images : [listing.image];
  const mainImage = images[Math.min(activeImage, images.length - 1)];
  const postedOn = new Date(listing.postedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <section className="pb-20 pt-8">
      <div className="mx-auto w-full px-6 sm:px-10 lg:px-16">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
        >
          <FiArrowLeft size={16} />
          Back
        </button>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row">
          <div className="flex gap-3 lg:w-1/2">
            {images.length > 1 && (
              <div className="flex w-16 flex-shrink-0 flex-col gap-3 sm:w-20">
                {images.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`View photo ${index + 1}`}
                    aria-pressed={activeImage === index}
                    className={`aspect-[4/5] overflow-hidden rounded-xl border-2 bg-gray-100 transition ${
                      activeImage === index
                        ? "border-gray-900"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="relative aspect-[3/4] w-full flex-1 overflow-hidden rounded-3xl bg-gray-100">
              <img
                src={mainImage}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
              {images.length > 1 && (
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-900 shadow-md transition hover:scale-105"
                >
                  <FiChevronRight size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="lg:max-w-md">
            <p className="text-sm font-semibold text-gray-500">
              {listing.brand ?? listing.categoryLabel}
            </p>
            <h1 className="mt-1 text-2xl font-black leading-snug tracking-tight text-gray-900 sm:text-3xl">
              {listing.title}
            </h1>
            <p className="mt-1 text-sm text-gray-400">{listing.categoryLabel}</p>

            <p className="mt-4 text-2xl font-bold text-gray-900">
              ₹{listing.price.toLocaleString("en-IN")}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-400">Condition</dt>
                <dd className="font-semibold text-gray-900">{listing.condition}</dd>
              </div>
              {listing.size && (
                <div>
                  <dt className="text-gray-400">Size</dt>
                  <dd className="font-semibold text-gray-900">{listing.size}</dd>
                </div>
              )}
              {listing.colour && (
                <div>
                  <dt className="text-gray-400">Colour</dt>
                  <dd className="font-semibold text-gray-900">{listing.colour}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-400">Location</dt>
                <dd className="flex items-center gap-1 font-semibold text-gray-900">
                  <FiMapPin size={12} />
                  {listing.city}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex items-center gap-3">
              <label htmlFor="quantity" className="text-sm font-bold text-gray-900">
                Quantity
              </label>
              <select
                id="quantity"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
              >
                {QUANTITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 rounded-full bg-gray-900 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-black"
              >
                {added ? "Added" : "Add to Cart"}
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
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border transition ${
                  wishlisted
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 text-gray-900 hover:border-gray-900"
                }`}
              >
                <FiHeart size={18} fill={wishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="mt-8">
              <h2 className="text-sm font-bold text-gray-900">Description</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {listing.description}
              </p>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              Listed by {listing.sellerName} on {postedOn} ·{" "}
              {listing.viewCount.toLocaleString("en-IN")} views
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gray-200 p-4">
              <FiShield size={20} className="mt-0.5 flex-shrink-0 text-gray-900" />
              <p className="text-sm leading-6 text-gray-600">
                <span className="font-semibold text-gray-900">Buyer protection</span> on
                every order, plus easy returns if the item is not as described.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ListingDetail;

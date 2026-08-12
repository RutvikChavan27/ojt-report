import { useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiChevronRight,
  FiHeart,
  FiShield,
  FiStar,
} from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";
import type { Product } from "../../lib/api";
import { useWishlist } from "../../store/WishlistContext";
import { useCart } from "../../store/CartContext";

type ProductDetailProps = {
  product: Product;
  onBack: () => void;
  /** Opens the bag, offered after something has been added to it. */
  onViewBag?: () => void;
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL"];
const QUANTITY_OPTIONS = [1, 2, 3, 4, 5];

// When a product has only one real photo, these fill the 4-tile grid with
// genuine crops/zooms of that same photo (wide + 3 detail close-ups) instead
// of faking extra angles. Real multi-photo products skip this and use their
// actual distinct images unscaled.
const SINGLE_PHOTO_CROPS = [
  { scale: 1, origin: "center" },
  { scale: 2.2, origin: "top" },
  { scale: 2.2, origin: "bottom" },
  { scale: 1.6, origin: "center" },
];

function ProductDetail({ product, onBack, onViewBag }: ProductDetailProps) {
  const { isWishlisted: checkWishlisted, toggle } = useWishlist();
  const { add: addToCart } = useCart();
  const wishlisted = checkWishlisted(product.id);

  const orderedSizes = [...product.sizes].sort(
    (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b),
  );

  // Starts unselected on purpose. Pre-selecting a size means someone can add the
  // wrong one without ever noticing they had a choice.
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  /** Feedback under the button: either "pick a size" or "it's in the bag". */
  const [notice, setNotice] = useState<"needs-size" | "added" | null>(null);

  const discountPercent = Math.round(
    (1 - product.price / product.originalPrice) * 100,
  );

  const galleryTiles =
    product.images.length > 1
      ? product.images.slice(0, 4).map((src) => ({ src, scale: 1, origin: "center" }))
      : SINGLE_PHOTO_CROPS.map((crop) => ({ src: product.image, ...crop }));
  const activeTile = galleryTiles[activeImageIndex] ?? galleryTiles[0];
  const goToNextImage = () =>
    setActiveImageIndex((index) => (index + 1) % galleryTiles.length);

  const handleAddToBag = () => {
    // Refuse rather than silently bagging a size the shopper never chose.
    if (orderedSizes.length > 0 && !selectedSize) {
      setNotice("needs-size");
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      size: selectedSize,
      category: product.category,
      currency: "$",
      quantity,
    });
    setNotice("added");
  };

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
            <div className="flex w-16 flex-shrink-0 flex-col gap-3 sm:w-20">
              {galleryTiles.map((tile, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  aria-label={`View photo ${index + 1}`}
                  aria-pressed={activeImageIndex === index}
                  className={`aspect-[4/5] overflow-hidden rounded-xl border-2 bg-gray-100 transition ${
                    activeImageIndex === index
                      ? "border-gray-900"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={tile.src}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ transform: `scale(${tile.scale})`, transformOrigin: tile.origin }}
                  />
                </button>
              ))}
            </div>

            <div className="relative aspect-[3/4] w-full flex-1 overflow-hidden rounded-3xl bg-gray-100">
              <img
                src={activeTile.src}
                alt={product.name}
                className="h-full w-full object-cover"
                style={{ transform: `scale(${activeTile.scale})`, transformOrigin: activeTile.origin }}
              />
              {galleryTiles.length > 1 && (
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={goToNextImage}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-900 shadow-md transition hover:scale-105"
                >
                  <FiChevronRight size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="lg:max-w-md">
            <p className="text-sm font-semibold text-gray-500">{product.brand}</p>
            <h1 className="mt-1 text-2xl font-black leading-snug tracking-tight text-gray-900 sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-gray-400">{product.category}</p>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">
                ${product.price}
              </span>
              <span className="text-base text-gray-400 line-through">
                ${product.originalPrice}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {discountPercent}% OFF
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-600">
              <FiStar size={14} fill="currentColor" className="text-gray-900" />
              <span className="font-semibold text-gray-900">{product.rating}</span>
            </div>

            {orderedSizes.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-bold text-gray-900">Select Size</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {orderedSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        // Choosing a size answers the warning, so retract it.
                        if (notice === "needs-size") setNotice(null);
                      }}
                      aria-pressed={selectedSize === size}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${
                        selectedSize === size
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 text-gray-900 hover:border-gray-900"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            {/* Sits directly above the button so the reason for a refused click
                is next to the thing that was clicked. */}
            {notice === "needs-size" && (
              <p
                role="alert"
                className="mt-6 flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900"
              >
                <FiAlertCircle size={15} className="flex-shrink-0" />
                Please select a size first.
              </p>
            )}

            {notice === "added" && (
              <div
                role="status"
                className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <FiCheck size={15} className="flex-shrink-0" />
                  Added to bag
                  {selectedSize ? ` · Size ${selectedSize}` : ""}
                </span>
                {onViewBag && (
                  <button
                    type="button"
                    onClick={onViewBag}
                    className="text-xs font-bold uppercase tracking-wide text-gray-900 underline decoration-gray-400 underline-offset-2 transition hover:decoration-gray-900"
                  >
                    View your bag
                  </button>
                )}
              </div>
            )}

            <div className={`flex items-center gap-3 ${notice ? "mt-3" : "mt-6"}`}>
              <button
                type="button"
                onClick={handleAddToBag}
                className="flex-1 rounded-full bg-gray-900 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-black"
              >
                Add to Bag
              </button>
              <button
                type="button"
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wishlisted}
                onClick={() => toggle(product)}
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border transition ${
                  wishlisted
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 text-gray-900 hover:border-gray-900"
                }`}
              >
                <FiHeart size={18} fill={wishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">Share</span>
              <a
                href="#"
                aria-label="Share on WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900"
              >
                <FaWhatsapp size={15} />
              </a>
              <a
                href="#"
                aria-label="Share on Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900"
              >
                <FaFacebookF size={13} />
              </a>
              <a
                href="#"
                aria-label="Share on Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900"
              >
                <FaTwitter size={15} />
              </a>
              <a
                href="#"
                aria-label="Share on Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900"
              >
                <FaInstagram size={15} />
              </a>
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-gray-200 p-4">
              <FiShield size={20} className="mt-0.5 flex-shrink-0 text-gray-900" />
              <p className="text-sm leading-6 text-gray-600">
                <span className="font-semibold text-gray-900">Free shipping</span>{" "}
                on this item, plus easy 30-day returns or exchanges. No questions
                asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductDetail;

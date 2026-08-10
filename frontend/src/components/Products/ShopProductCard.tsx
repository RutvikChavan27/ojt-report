import { useState } from "react";
import { FiHeart, FiStar } from "react-icons/fi";
import type { Product } from "../../lib/api";

type ShopProductCardProps = {
  product: Product;
};

function ShopProductCard({ product }: ShopProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discountPercent = Math.round(
    (1 - product.price / product.originalPrice) * 100
  );
  const bulkPrice = product.price * 3 - 20;

  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-bold text-gray-900 shadow-sm">
          <FiStar size={11} fill="currentColor" />
          {product.rating}
        </span>

        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={() => setIsWishlisted((liked) => !liked)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm transition hover:scale-105"
        >
          <FiHeart size={15} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
        <span>{product.category}</span>
        {product.variantCount ? <span>+{product.variantCount}</span> : null}
      </div>

      <h3 className="mt-1 text-sm font-bold leading-snug text-gray-900">
        {product.name}
      </h3>

      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-base font-bold text-gray-900">
          ${product.price}
        </span>
        <span className="text-xs text-gray-400 line-through">
          ${product.originalPrice}
        </span>
        <span className="text-xs font-bold text-gray-900">
          {discountPercent}% OFF
        </span>
      </div>

      <p className="mt-1 text-xs font-semibold text-gray-500">
        Buy 3 for ${bulkPrice}
      </p>
    </div>
  );
}

export default ShopProductCard;

import { FiHeart, FiPlus } from "react-icons/fi";
import type { Product } from "../../lib/api";
import { useWishlist } from "../../store/WishlistContext";

type ProductCardProps = {
  product: Product;
  onSelectProduct?: (product: Product) => void;
};

function ProductCard({ product, onSelectProduct }: ProductCardProps) {
  const { isWishlisted: checkWishlisted, toggle } = useWishlist();
  const isWishlisted = checkWishlisted(product.id);

  return (
    <div className="group">
      <button
        type="button"
        onClick={() => onSelectProduct?.(product)}
        aria-label={`View ${product.name}`}
        className="relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-100 text-left"
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        <span
          role="button"
          tabIndex={0}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={(event) => {
            event.stopPropagation();
            toggle(product);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.stopPropagation();
              event.preventDefault();
              toggle(product);
            }
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm transition hover:scale-105"
        >
          <FiHeart size={15} fill={isWishlisted ? "currentColor" : "none"} />
        </span>

        <span
          role="button"
          tabIndex={0}
          aria-label={`Quick add ${product.name}`}
          onClick={(event) => event.stopPropagation()}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 shadow-md transition group-hover:scale-105"
        >
          <FiPlus size={16} />
        </span>
      </button>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
        <span>{product.category}</span>
        {product.variantCount ? <span>+{product.variantCount}</span> : null}
      </div>

      <div className="mt-1 flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold leading-snug text-gray-900">
          {product.name}
        </h3>
        <span className="whitespace-nowrap text-sm font-semibold text-gray-900">
          ${product.price}
        </span>
      </div>
    </div>
  );
}

export default ProductCard;

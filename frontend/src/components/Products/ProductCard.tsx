import { FiPlus } from "react-icons/fi";
import type { Product } from "../../lib/api";

type ProductCardProps = {
  product: Product;
};

function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        <button
          type="button"
          aria-label={`Quick add ${product.name}`}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 shadow-md transition group-hover:scale-105"
        >
          <FiPlus size={16} />
        </button>
      </div>

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

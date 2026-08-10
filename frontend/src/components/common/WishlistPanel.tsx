import { FiHeart, FiX } from "react-icons/fi";
import { useWishlist } from "../../store/WishlistContext";

type WishlistPanelProps = {
  onClose: () => void;
};

function WishlistPanel({ onClose }: WishlistPanelProps) {
  const { items, remove } = useWishlist();

  return (
    <div
      className="fixed inset-0 z-100 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-sm animate-[panel-in_0.25s_ease-out] flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-black tracking-tight text-gray-900">
            My Wishlist ({items.length} {items.length === 1 ? "item" : "items"})
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition hover:bg-gray-200"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-gray-400">
              <FiHeart size={28} />
              <p className="text-sm">Your wishlist is empty.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((product) => (
                <li
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-gray-100"
                >
                  <div className="relative h-40 w-full bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${product.name} from wishlist`}
                      onClick={() => remove(product.id)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm transition hover:scale-105"
                    >
                      <FiX size={14} />
                    </button>
                  </div>

                  <div className="px-4 pb-4 pt-3">
                    <p className="text-xs text-gray-400">{product.category}</p>
                    <p className="text-sm font-bold leading-snug text-gray-900">
                      {product.name}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      ${product.price}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    className="block w-full border-t border-gray-100 py-3 text-center text-sm font-bold tracking-wide text-gray-900 transition hover:bg-gray-50"
                  >
                    MOVE TO CART
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default WishlistPanel;

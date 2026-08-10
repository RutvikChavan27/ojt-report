import { FiHeart, FiX } from "react-icons/fi";
import { useWishlist } from "../../store/WishlistContext";

type WishlistProps = {
  onGoToShopClick: () => void;
};

function Wishlist({ onGoToShopClick }: WishlistProps) {
  const { items, remove } = useWishlist();

  return (
    <section className="pb-20 pt-8">
      <div className="mx-auto w-full px-6 sm:px-10 lg:px-16">
        <h1 className="text-lg font-bold text-gray-900">
          My Wishlist ({items.length} {items.length === 1 ? "item" : "items"})
        </h1>

        {items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 py-16 text-center text-gray-400">
            <FiHeart size={28} />
            <p className="text-sm">Your wishlist is empty.</p>
            <button
              type="button"
              onClick={onGoToShopClick}
              className="mt-2 rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-black/5"
            >
              Go To Shop
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3">
            {items.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-gray-200"
              >
                <div className="relative aspect-[4/3] w-full bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${product.name} from wishlist`}
                    onClick={() => remove(product.id)}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm transition hover:scale-105"
                  >
                    <FiX size={15} />
                  </button>
                </div>

                <div className="px-4 pb-4 pt-3">
                  <p className="text-sm font-bold leading-snug text-gray-900">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{product.category}</p>
                  <p className="mt-1.5 text-sm font-semibold text-gray-900">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Wishlist;

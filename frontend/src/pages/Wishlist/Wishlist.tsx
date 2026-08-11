import { FiHeart, FiX } from "react-icons/fi";
import { useWishlist, type WishlistItem } from "../../store/WishlistContext";
import { useCart } from "../../store/CartContext";

type WishlistProps = {
  onGoToShopClick: () => void;
};

function Wishlist({ onGoToShopClick }: WishlistProps) {
  const { items, remove } = useWishlist();
  const { add: addToCart } = useCart();

  /**
   * Adds to the bag and drops from the wishlist — "move", not "copy". Only
   * items with a price can be bought, which excludes the lookbook photos, so
   * those are just removed.
   */
  const moveToCart = (item: WishlistItem) => {
    if (item.price !== undefined) {
      addToCart({
        productId: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        category: item.category,
        // Wishlisted marketplace listings are the ones carrying a price here.
        currency: "₹",
      });
    }
    remove(item.id);
  };

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
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-gray-200"
              >
                <div className="relative aspect-[3/4] w-full bg-gray-100">
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
                    <FiX size={13} />
                  </button>
                </div>

                <div className="px-3 pb-3 pt-2.5">
                  <p className="text-sm font-bold leading-snug text-gray-900">
                    {product.name}
                  </p>
                  {product.category && (
                    <p className="mt-1 text-xs text-gray-400">{product.category}</p>
                  )}
                  {product.price !== undefined && (
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      ${product.price}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => moveToCart(product)}
                  className="block w-full border-t border-gray-100 py-2.5 text-center text-xs font-bold tracking-wide text-gray-900 transition hover:bg-gray-50"
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

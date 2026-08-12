import {
  FiChevronRight,
  FiHeart,
  FiPercent,
  FiRefreshCw,
  FiShield,
  FiShoppingBag,
  FiTruck,
  FiX,
} from "react-icons/fi";
import { useCart, type CartItem } from "../../store/CartContext";
import { useWishlist } from "../../store/WishlistContext";

type CartProps = {
  /** Where an empty bag sends you — the home page, not the filtered shop. */
  onStartShopping: () => void;
};

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5];

/** Formats a price with the currency the item was added in. */
const money = (currency: string, amount: number) =>
  `${currency}${amount.toLocaleString("en-IN")}`;

/**
 * A shipping estimate, not a promise from any carrier — there is no fulfilment
 * system behind this, so it is labelled "Est." in the UI.
 */
function deliveryEstimate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * The bag. Totals are grouped by currency because storefront products are
 * priced in dollars and marketplace listings in rupees; adding those together
 * would produce a meaningless number.
 */
function Cart({ onStartShopping }: CartProps) {
  const { items, count, totals, remove, setQuantity } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  /** Moves a line out of the bag and into the wishlist for later. */
  const saveForLater = (item: CartItem) => {
    if (!isWishlisted(item.productId)) {
      toggle({
        id: item.productId,
        name: item.name,
        image: item.image,
        category: item.category,
        price: item.price,
      });
    }
    remove(item.id);
  };

  if (items.length === 0) {
    return (
      <section className="pb-20 pt-10">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <div className="rounded-3xl border border-gray-200 bg-black/[0.03] px-6 py-20 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-900">
              <FiShoppingBag size={22} />
            </span>
            <h1 className="mt-5 text-lg font-black tracking-tight text-gray-900">
              Your bag is empty
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Once you add something, it will show up here.
            </p>
            <button
              type="button"
              onClick={onStartShopping}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-sm font-bold text-white transition hover:bg-black"
            >
              Start shopping
              <FiChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>
    );
  }

  const savingsLines = totals.filter((total) => total.savings > 0);
  const estimate = deliveryEstimate();

  return (
    <section className="pb-20 pt-8">
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-black tracking-tight text-gray-900">My Bag</h1>
          <span className="text-sm text-gray-500">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>

        {savingsLines.length > 0 && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-gray-900 px-4 py-3 text-white">
            <FiPercent size={15} className="flex-shrink-0" />
            <p className="text-sm">
              You are saving{" "}
              <span className="font-bold">
                {savingsLines
                  .map((total) => money(total.currency, total.savings))
                  .join(" + ")}
              </span>{" "}
              on this order
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Lines */}
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-black/[0.03] transition"
              >
                <div className="flex gap-4 p-4">
                  <div className="h-32 w-26 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-36 sm:w-28">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1 pr-7">
                    {item.category && (
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">
                        {item.category}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-bold leading-snug text-gray-900">
                      {item.name}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {item.size && (
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-900">
                          Size {item.size}
                        </span>
                      )}
                      <label className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-900">
                        Qty
                        <select
                          value={item.quantity}
                          onChange={(event) =>
                            setQuantity(item.id, Number(event.target.value))
                          }
                          aria-label={`Quantity for ${item.name}`}
                          className="bg-transparent text-xs font-semibold text-gray-900 outline-none"
                        >
                          {QUANTITY_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-base font-black text-gray-900">
                        {money(item.currency, item.price * item.quantity)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <>
                          <span className="text-xs text-gray-400 line-through">
                            {money(item.currency, item.originalPrice * item.quantity)}
                          </span>
                          <span className="rounded-md bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Save{" "}
                            {money(
                              item.currency,
                              (item.originalPrice - item.price) * item.quantity,
                            )}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                      <FiTruck size={12} className="flex-shrink-0" />
                      Est. delivery by{" "}
                      <span className="font-semibold text-gray-900">{estimate}</span>
                    </p>
                  </div>
                </div>

                <div className="flex divide-x divide-gray-100 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => saveForLater(item)}
                    className="flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-900 transition hover:bg-gray-50"
                  >
                    <FiHeart size={13} />
                    Save for later
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                  >
                    Remove
                  </button>
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${item.name} from bag`}
                  onClick={() => remove(item.id)}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <FiX size={15} />
                </button>
              </li>
            ))}
          </ul>

          {/* Summary */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/[0.03]">
              <h2 className="border-b border-gray-100 px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                Price Summary
              </h2>

              <dl className="space-y-3 px-5 py-4">
                {totals.map((total) => (
                  <div key={total.currency} className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <dt className="text-gray-500">
                        {totals.length > 1
                          ? `Bag total (${total.currency})`
                          : "Bag total"}{" "}
                        <span className="text-gray-400">
                          ({total.itemCount}{" "}
                          {total.itemCount === 1 ? "item" : "items"})
                        </span>
                      </dt>
                      <dd className="font-semibold text-gray-900">
                        {money(total.currency, total.mrp)}
                      </dd>
                    </div>
                    {total.savings > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <dt className="text-gray-500">Discount</dt>
                        <dd className="font-semibold text-gray-900">
                          −{money(total.currency, total.savings)}
                        </dd>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between text-sm">
                  <dt className="text-gray-500">Delivery</dt>
                  <dd className="font-semibold text-gray-900">Free</dd>
                </div>

                <div className="flex items-baseline justify-between border-t border-gray-100 pt-3">
                  <dt className="text-sm font-black text-gray-900">Total</dt>
                  <dd className="text-lg font-black text-gray-900">
                    {totals
                      .map((total) => money(total.currency, total.payable))
                      .join(" + ")}
                  </dd>
                </div>
              </dl>

              <div className="px-5 pb-5">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3.5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-black"
                >
                  Proceed
                  <FiChevronRight size={16} />
                </button>

                {totals.length > 1 && (
                  <p className="mt-3 text-xs leading-relaxed text-gray-400">
                    This bag mixes currencies, so totals are shown separately
                    rather than combined.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Quality assured", icon: <FiShield size={15} /> },
                { label: "Secure payment", icon: <FiShoppingBag size={15} /> },
                { label: "Easy returns", icon: <FiRefreshCw size={15} /> },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-black/[0.03] px-2 py-3 text-center text-gray-900"
                >
                  {badge.icon}
                  <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default Cart;

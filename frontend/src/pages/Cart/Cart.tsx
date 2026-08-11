import { FiPercent, FiShield, FiShoppingBag, FiTruck, FiX } from "react-icons/fi";
import { useCart } from "../../store/CartContext";

type CartProps = {
  onGoToShopClick: () => void;
};

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5];

/** Formats a line price with the currency the item was added in. */
const money = (currency: string, amount: number) =>
  `${currency}${amount.toLocaleString("en-IN")}`;

/**
 * The bag: every line with its size and quantity on the left, an order summary
 * on the right. Totals are grouped by currency because storefront products are
 * priced in dollars and marketplace listings in rupees — adding those together
 * would produce a meaningless number.
 */
function Cart({ onGoToShopClick }: CartProps) {
  const { items, count, totals, remove, setQuantity } = useCart();

  if (items.length === 0) {
    return (
      <section className="pb-20 pt-8">
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-10 lg:px-16">
          <h1 className="text-base font-bold text-gray-900">My Bag</h1>
          <div className="mt-10 flex flex-col items-center gap-3 py-16 text-center text-gray-400">
            <FiShoppingBag size={28} />
            <p className="text-sm">Your bag is empty.</p>
            <button
              type="button"
              onClick={onGoToShopClick}
              className="mt-2 rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-black/5"
            >
              Go To Shop
            </button>
          </div>
        </div>
      </section>
    );
  }

  const totalSavings = totals.filter((total) => total.savings > 0);

  return (
    <section className="pb-20 pt-8">
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16">
        <h1 className="text-base font-bold text-gray-900">
          My Bag{" "}
          <span className="text-gray-500">
            ({count} {count === 1 ? "item" : "items"})
          </span>
        </h1>

        {totalSavings.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/60 px-4 py-3">
            <FiPercent size={15} className="flex-shrink-0 text-gray-900" />
            <p className="text-sm text-gray-700">
              You are saving{" "}
              <span className="font-bold text-gray-900">
                {totalSavings
                  .map((total) => money(total.currency, total.savings))
                  .join(" + ")}
              </span>{" "}
              on this order
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Lines */}
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="relative flex gap-4 rounded-2xl border border-gray-200 p-4"
              >
                <div className="h-28 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 pr-6">
                  {item.category && (
                    <p className="text-xs text-gray-400">{item.category}</p>
                  )}
                  <p className="mt-0.5 text-sm font-bold leading-snug text-gray-900">
                    {item.name}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {item.size && (
                      <span className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-900">
                        Size: {item.size}
                      </span>
                    )}

                    <label className="flex items-center gap-1.5 text-xs text-gray-500">
                      Qty
                      <select
                        value={item.quantity}
                        onChange={(event) =>
                          setQuantity(item.id, Number(event.target.value))
                        }
                        aria-label={`Quantity for ${item.name}`}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-900 outline-none focus:border-gray-900"
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
                    <span className="text-base font-bold text-gray-900">
                      {money(item.currency, item.price * item.quantity)}
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <>
                        <span className="text-xs text-gray-400 line-through">
                          {money(item.currency, item.originalPrice * item.quantity)}
                        </span>
                        <span className="text-xs font-semibold text-gray-900">
                          You saved{" "}
                          {money(
                            item.currency,
                            (item.originalPrice - item.price) * item.quantity,
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${item.name} from bag`}
                  onClick={() => remove(item.id)}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <FiX size={15} />
                </button>
              </li>
            ))}
          </ul>

          {/* Summary */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-900">Price Summary</h2>

              <dl className="mt-4 space-y-3">
                {/* Bag total is pre-discount, so bag total − discount === total
                    and the column reads as real arithmetic. */}
                {totals.map((total) => (
                  <div key={total.currency} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <dt className="text-gray-500">
                        Bag total
                        {totals.length > 1 ? ` (${total.currency})` : ""}
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

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                  <dt className="font-bold text-gray-900">Total</dt>
                  <dd className="font-bold text-gray-900">
                    {totals
                      .map((total) => money(total.currency, total.payable))
                      .join(" + ")}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
                <FiTruck size={14} className="flex-shrink-0 text-gray-900" />
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-900">Free delivery</span> on
                  this order
                </p>
              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-full bg-gray-900 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-black"
              >
                Proceed
              </button>

              {totals.length > 1 && (
                <p className="mt-3 text-xs text-gray-400">
                  Your bag mixes currencies, so totals are shown per currency
                  rather than combined.
                </p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Quality assured", icon: <FiShield size={16} /> },
                { label: "Secure payment", icon: <FiShoppingBag size={16} /> },
                { label: "Easy returns", icon: <FiTruck size={16} /> },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 px-2 py-3 text-gray-900"
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

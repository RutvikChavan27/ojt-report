import { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheck, FiRepeat, FiX } from "react-icons/fi";
import type { ApiOffer, ApiOfferStatus } from "../../lib/api";
import { formatPrice } from "../../lib/format";

const STATUS_LABEL: Record<ApiOfferStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  countered: "Countered",
};

const STATUS_STYLE: Record<ApiOfferStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  countered: "bg-cyan-50 text-cyan-700",
};

type OfferCardProps = {
  offer: ApiOffer;
  /** Whose dashboard this card renders on — decides which actions apply. */
  viewer: "buyer" | "seller";
  /** True while any of this card's own actions are in flight. */
  busy?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: (counterPrice: number) => void;
};

/**
 * One offer, shown identically in shape on both sides of it — a seller's
 * "Offers Received" and a buyer's "My Offers" — with only the available
 * actions differing:
 *
 *   - A `pending` offer awaits the seller: Accept / Reject / Counter Offer.
 *   - A `countered` offer awaits the buyer: Accept / Reject the counter.
 *   - `accepted` and `rejected` are terminal — just a status to read.
 *
 * Accepting never marks the listing sold — that stays the seller's own,
 * separate "Mark as sold" action on the existing dashboard; an accepted offer
 * is an agreement to sell, not the sale itself.
 */
function OfferCard({ offer, viewer, busy = false, onAccept, onReject, onCounter }: OfferCardProps) {
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterValue, setCounterValue] = useState("");
  const [counterError, setCounterError] = useState<string | null>(null);

  const awaitingSeller = offer.status === "pending" && viewer === "seller";
  const awaitingBuyer = offer.status === "countered" && viewer === "buyer";
  const canRespond = awaitingSeller || awaitingBuyer;

  const submitCounter = () => {
    const price = Number(counterValue);
    if (!counterValue.trim() || !Number.isFinite(price) || price <= 0) {
      setCounterError("Enter a valid amount greater than ₹0.");
      return;
    }
    setCounterError(null);
    onCounter?.(price);
  };

  return (
    <li className="rounded-2xl border border-taupe bg-gradient-to-br from-cyan-50 to-mint-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/listing/${offer.listingId}`}
            className="text-sm font-bold text-charcoal-900 hover:underline"
          >
            {offer.listingTitle}
          </Link>
          <dl className="mt-2 space-y-1 text-xs text-charcoal-600">
            <div className="flex gap-1.5">
              <dt className="text-charcoal-400">Listed price:</dt>
              <dd className="font-semibold">{formatPrice(offer.listingPrice)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-charcoal-400">
                {viewer === "seller" ? "Offer:" : "Your offer:"}
              </dt>
              <dd className="font-semibold">{formatPrice(offer.offeredPrice)}</dd>
            </div>
          </dl>
        </div>

        <span
          className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[offer.status]}`}
        >
          {STATUS_LABEL[offer.status]}
        </span>
      </div>

      {/* One sentence of plain-English status, matching what each side was
          told in the spec — "Your offer of ₹X was accepted", etc. */}
      {offer.status === "accepted" && (
        <p className="mt-3 text-xs font-semibold text-emerald-700">
          {viewer === "buyer"
            ? `Your offer of ${formatPrice(offer.counterPrice ?? offer.offeredPrice)} was accepted.`
            : "You accepted this offer."}
        </p>
      )}
      {offer.status === "rejected" && (
        <p className="mt-3 text-xs font-semibold text-rose-700">
          {viewer === "buyer" ? "Your offer was rejected." : "You rejected this offer."}
        </p>
      )}
      {offer.status === "countered" && offer.counterPrice !== null && (
        <p className="mt-3 text-xs font-semibold text-cyan-700">
          {viewer === "buyer"
            ? `Seller countered with ${formatPrice(offer.counterPrice)}.`
            : `You countered with ${formatPrice(offer.counterPrice)}.`}
        </p>
      )}

      {canRespond && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            className="flex items-center gap-1.5 rounded-full bg-mist px-4 py-2 text-xs font-bold text-charcoal-900 transition hover:shadow-md hover:shadow-cyan-500/30 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiCheck size={13} />
            Accept
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="flex items-center gap-1.5 rounded-full border border-taupe px-4 py-2 text-xs font-bold text-charcoal-500 transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiX size={13} />
            Reject
          </button>

          {/* Countering a counter is not offered — only the original, still-pending
              offer can be countered (see the table comment in marketplace.sql) — so
              this button only appears for the seller answering a fresh offer. */}
          {awaitingSeller && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setCounterOpen((open) => !open)}
              className="flex items-center gap-1.5 rounded-full border border-cyan-500 px-4 py-2 text-xs font-bold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRepeat size={13} />
              Counter Offer
            </button>
          )}
        </div>
      )}

      {awaitingSeller && counterOpen && (
        <div className="mt-3 flex flex-wrap items-start gap-2">
          <div>
            <input
              type="number"
              min={1}
              step="1"
              inputMode="decimal"
              placeholder="Your counter price"
              value={counterValue}
              onChange={(event) => {
                setCounterValue(event.target.value);
                setCounterError(null);
              }}
              aria-label="Counter price"
              className="w-40 rounded-lg border border-taupe bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            {counterError && (
              <p className="mt-1 text-xs text-rose-600">{counterError}</p>
            )}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={submitCounter}
            className="rounded-full bg-mist px-4 py-2 text-xs font-bold text-charcoal-900 transition hover:shadow-md hover:shadow-cyan-500/30 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send Counter
          </button>
        </div>
      )}
    </li>
  );
}

export default OfferCard;

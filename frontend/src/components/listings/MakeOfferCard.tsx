import { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheck, FiTag } from "react-icons/fi";
import { createOffer } from "../../lib/api";
import { formatPrice } from "../../lib/format";
import { useAuth } from "../../store/AuthContext";

type MakeOfferCardProps = {
  listingId: string;
  listingPrice: number;
  sellerId: number;
  /** False for a sold or expired listing — nothing here applies to those. */
  available: boolean;
};

/**
 * "Make an Offer": a buyer proposes a price on the listing, separate from —
 * and shown alongside — Contact Seller. This is the one entry point for
 * starting a negotiation; once an offer exists, its status and any counter
 * are tracked on "My Offers" and the seller's dashboard, not here.
 *
 * Hidden entirely rather than shown-disabled for the two cases where making
 * an offer is simply not this visitor's action to take: the listing's own
 * owner, and anything not currently active. A signed-out visitor still sees
 * the button (so it's discoverable) but is prompted to log in on request,
 * the same pattern "Save this search" already uses.
 */
function MakeOfferCard({ listingId, listingPrice, sellerId, available }: MakeOfferCardProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!available || (user && user.id === sellerId)) return null;

  const submit = async () => {
    const price = Number(amount);
    if (!amount.trim() || !Number.isFinite(price) || price <= 0) {
      setError("Enter a valid offer amount greater than ₹0.");
      return;
    }

    setSending(true);
    setError(null);
    try {
      await createOffer(listingId, price);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that offer.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-taupe bg-gradient-to-br from-cyan-50 to-mint-50 p-5">
      <h2 className="text-xs font-bold uppercase tracking-wide text-charcoal-500">
        Negotiate Price
      </h2>

      {sent ? (
        <div className="mt-3 flex items-start gap-2 text-sm text-emerald-700">
          <FiCheck size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            Offer sent. Track its status under{" "}
            <Link to="/my-offers" className="font-bold underline decoration-emerald-400 underline-offset-2">
              My Offers
            </Link>
            .
          </p>
        </div>
      ) : !user ? (
        <>
          <button
            type="button"
            disabled
            title="Log in to make an offer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-mist py-3 text-sm font-bold text-charcoal-900 opacity-50"
          >
            <FiTag size={15} />
            Make an Offer
          </button>
          <p className="mt-2 text-xs text-charcoal-400">
            <Link to="/login" className="font-semibold text-cyan-700 hover:underline">
              Log in
            </Link>{" "}
            to make an offer.
          </p>
        </>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-mist py-3 text-sm font-bold text-charcoal-900 transition hover:shadow-md hover:shadow-cyan-500/30 hover:brightness-105"
        >
          <FiTag size={15} />
          Make an Offer
        </button>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-charcoal-700">
            Seller&apos;s Price:{" "}
            <span className="font-bold text-charcoal-900">{formatPrice(listingPrice)}</span>
          </p>

          <label htmlFor="offer-amount" className="mt-3 block text-xs font-semibold text-charcoal-500">
            Your Offer
          </label>
          <input
            id="offer-amount"
            type="number"
            min={1}
            step="1"
            inputMode="decimal"
            placeholder="e.g. 35000"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setError(null);
            }}
            className="mt-1.5 w-full rounded-lg border border-taupe bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
          {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={sending}
              onClick={submit}
              className="flex-1 rounded-full bg-mist py-2.5 text-sm font-bold text-charcoal-900 transition hover:shadow-md hover:shadow-cyan-500/30 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send Offer"}
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => {
                setOpen(false);
                setAmount("");
                setError(null);
              }}
              className="rounded-full border border-taupe px-4 py-2.5 text-sm font-bold text-charcoal-600 transition hover:border-charcoal-400 hover:text-charcoal-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MakeOfferCard;

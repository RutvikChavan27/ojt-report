import { useState } from "react";
import { FiPhone, FiUser } from "react-icons/fi";
import type { ApiSeller } from "../../lib/api";
import { monthYear } from "../../lib/format";

type SellerCardProps = {
  seller: ApiSeller;
};

/**
 * Who is selling, and how to reach them.
 *
 * The number stays masked until "Contact seller" is pressed. On a real
 * classifieds site that gate is what stops a scraper collecting every seller's
 * phone number in one pass, and it also makes the contact action deliberate.
 *
 * The whole contact block disappears when the seller has no number on file,
 * which is every seeded account — nothing is collecting phone numbers yet. It
 * previously invented the hidden digits client-side, which put a number in
 * front of buyers that belonged to nobody.
 *
 * Even when a number does exist the API sends only the masked form, so
 * revealing the rest will need an endpoint of its own rather than a string
 * operation here.
 */
function SellerCard({ seller }: SellerCardProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-2xl border border-taupe bg-gradient-to-br from-cyan-50 to-mint-50 p-5">
      <h2 className="text-xs font-bold uppercase tracking-wide text-charcoal-500">
        Posted by
      </h2>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-charcoal-900 text-white">
          <FiUser size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-charcoal-900">
            {seller.name}
          </p>
          <p className="text-xs text-charcoal-500">
            Member since {monthYear(seller.memberSince)}
          </p>
        </div>
      </div>

      {seller.phoneMasked ? (
        <>
          {revealed ? (
            <a
              href={`tel:${seller.phoneMasked}`}
              onClick={(event) => event.preventDefault()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-cyan-500 py-3 text-sm font-bold text-cyan-700"
            >
              <FiPhone size={15} />
              {seller.phoneMasked}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00c9ff] to-[#92fe9d] py-3 text-sm font-bold text-charcoal-900 transition hover:shadow-md hover:shadow-cyan-500/30 hover:brightness-105"
            >
              <FiPhone size={15} />
              Contact seller
            </button>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-charcoal-400">
            Only the last digits are shown until the seller shares the rest.
          </p>
        </>
      ) : (
        <p className="mt-4 text-[11px] leading-relaxed text-charcoal-400">
          This seller has not added a contact number.
        </p>
      )}
    </div>
  );
}

export default SellerCard;

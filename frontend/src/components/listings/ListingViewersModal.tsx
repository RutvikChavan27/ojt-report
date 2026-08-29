import { FiUser } from "react-icons/fi";
import Modal from "../common/Modal";
import EmptyState from "../common/EmptyState";
import { fetchListingViewers } from "../../lib/api";
import { relativeTime } from "../../lib/format";
import { useApi } from "../../hooks/useApi";

type ListingViewersModalProps = {
  /** The listing to show viewers for, or null when the modal is closed. */
  listingId: string | null;
  listingTitle: string;
  onClose: () => void;
};

/**
 * "Who viewed my listing" — opened from the Views count on My Listings.
 *
 * Only ever requested for a listing the signed-in seller owns: the server's
 * GET /api/listings/:id/viewers is behind requireListingOwner, the same
 * gate edit/delete use, so a listing id belonging to a different seller
 * comes back as a 403 rather than someone else's viewer list — the empty
 * state below doubles as what that failure shows, since neither case has
 * anything useful to add beyond "nothing to show here."
 */
function ListingViewersModal({
  listingId,
  listingTitle,
  onClose,
}: ListingViewersModalProps) {
  const { data, loading, error } = useApi(
    () => (listingId ? fetchListingViewers(listingId) : Promise.resolve([])),
    [listingId],
  );

  const viewers = data ?? [];

  return (
    <Modal open={listingId !== null} onClose={onClose} title="Who viewed this listing">
      <p className="text-sm text-charcoal-500">{listingTitle}</p>

      <div className="mt-4">
        {loading ? (
          <ul className="space-y-3">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-12 animate-pulse rounded-xl bg-sand/60"
              />
            ))}
          </ul>
        ) : error || viewers.length === 0 ? (
          <EmptyState
            title="No views yet"
            description={
              error
                ? undefined
                : "Once a signed-in buyer opens this listing, they'll show up here."
            }
          />
        ) : (
          <ul className="space-y-1">
            {viewers.map((viewer) => (
              <li
                key={viewer.viewerId}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-charcoal-900 text-white">
                  <FiUser size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-charcoal-900">
                    {viewer.name}
                  </span>
                  <span className="block text-xs text-charcoal-500">
                    Viewed {relativeTime(viewer.viewedAt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

export default ListingViewersModal;

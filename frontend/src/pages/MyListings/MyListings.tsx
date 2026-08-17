import { useState } from "react";
import Container from "../../components/layout/Container";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiEdit2,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";
import EmptyState from "../../components/common/EmptyState";
import LoadingSkeleton from "../../components/common/LoadingSkeleton";
import { formatPrice, relativeTime } from "../../lib/format";
import {
  deleteListing,
  fetchMyListings,
  markListingSold,
  renewListing,
} from "../../lib/api";
import { useApi } from "../../hooks/useApi";

type ListingStatus = "active" | "sold" | "expired";

/**
 * What each status is called on screen.
 *
 * The stored value stays "expired" — it is a `listing_status` enum in the
 * database and what search filters on — so only the wording changes here.
 * Sellers see "Out of stock", which describes the item rather than the posting
 * window.
 *
 * Every label on this page comes from this map, so the tab, the badge and the
 * empty state cannot drift apart.
 */
const STATUS_LABEL: Record<ListingStatus, string> = {
  active: "Active",
  sold: "Sold",
  expired: "Out of stock",
};

/** Tab order. Labels come from STATUS_LABEL. */
const TABS: ListingStatus[] = ["active", "sold", "expired"];

const STATUS_STYLE: Record<ListingStatus, string> = {
  active: "bg-gray-900 text-white",
  sold: "bg-black/[0.08] text-gray-600",
  expired: "border border-gray-300 text-gray-500",
};

/**
 * The seller dashboard: the signed-in user's own listings, by status.
 *
 * Everything here is server state. Each action calls its endpoint and then
 * refetches rather than patching a local array, so what is on screen is what is
 * in the database — a reload can never resurrect something deleted, which is
 * exactly what happened while this ran on a fixture.
 *
 * Which listings come back is decided by the session, not by anything sent from
 * here, and every write is checked against `listings.seller_id` on the server.
 */
function MyListings() {
  const [tab, setTab] = useState<ListingStatus>("active");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useApi(fetchMyListings, []);
  const listings = data ?? [];

  const visible = listings.filter((listing) => listing.status === tab);

  const countFor = (status: ListingStatus) =>
    listings.filter((listing) => listing.status === status).length;

  /**
   * Runs one action, then refetches.
   *
   * The row is disabled while in flight so a double click cannot fire two
   * deletes, and a failure surfaces the server's message instead of leaving the
   * UI showing a change that did not happen.
   */
  const run = async (id: string, action: () => Promise<unknown>) => {
    if (busyId) return;
    setBusyId(id);
    setActionError(null);
    try {
      await action();
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusyId(null);
    }
  };

  const markSold = (id: string) => run(id, () => markListingSold(id));
  const renew = (id: string) => run(id, () => renewListing(id));

  const remove = (id: string) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    return run(id, () => deleteListing(id));
  };

  const action =
    "flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-900 transition hover:border-gray-900";

  return (
    <Container className="py-8" narrow="lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
            My listings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage what you have posted.
          </p>
        </div>

        <Link
          to="/post-ad"
          className="flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-black"
        >
          <FiPlus size={15} />
          Post an ad
        </Link>
      </div>

      {/* Status tabs */}
      <div
        role="tablist"
        aria-label="Listing status"
        className="mt-6 flex gap-2 border-b border-gray-200"
      >
        {TABS.map((status) => (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={tab === status}
            onClick={() => setTab(status)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition ${
              tab === status
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {STATUS_LABEL[status]} ({countFor(status)})
          </button>
        ))}
      </div>

      {actionError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-gray-300 bg-black/[0.03] px-4 py-2.5 text-sm text-gray-900"
        >
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="mt-8">
          <EmptyState title="Could not load your listings" description={error}>
            <button
              type="button"
              onClick={reload}
              className="inline-flex rounded-full bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-black"
            >
              Try again
            </button>
          </EmptyState>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={`No ${STATUS_LABEL[tab].toLowerCase()} listings`}
            description={
              tab === "active"
                ? "Post an ad and it will show up here."
                : `Nothing here yet.`
            }
          >
            {tab === "active" && (
              <Link
                to="/post-ad"
                className="inline-flex rounded-full bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-black"
              >
                Post an ad
              </Link>
            )}
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((listing) => (
            <li
              key={listing.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row">
                <Link
                  to={`/listing/${listing.id}`}
                  className="h-28 w-full flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:w-40"
                >
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      to={`/listing/${listing.id}`}
                      className="text-sm font-bold text-gray-900 hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        STATUS_STYLE[listing.status as ListingStatus]
                      }`}
                    >
                      {STATUS_LABEL[listing.status as ListingStatus]}
                    </span>
                  </div>

                  <p className="mt-1 text-base font-black text-gray-900">
                    {formatPrice(listing.price)}
                  </p>

                  <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiEye size={11} />
                      <dt className="sr-only">Views</dt>
                      <dd>{listing.viewCount.toLocaleString("en-IN")} views</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Posted</dt>
                      <dd>Posted {relativeTime(listing.postedAt)}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Expires</dt>
                      <dd>Expires {new Date(listing.expiresAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-gray-200 px-4 py-3">
                <Link to={`/listing/${listing.id}`} className={action}>
                  <FiEdit2 size={12} />
                  View
                </Link>

                {listing.status === "active" && (
                  <button
                    type="button"
                    disabled={busyId === listing.id}
                    onClick={() => markSold(listing.id)}
                    className={`${action} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <FiCheckCircle size={12} />
                    Mark as sold
                  </button>
                )}

                {/* Only an expired listing can be renewed. A sold one is
                    refused by the server anyway — offering the button would
                    just be a route to an error message. */}
                {listing.status === "expired" && (
                  <button
                    type="button"
                    disabled={busyId === listing.id}
                    onClick={() => renew(listing.id)}
                    className={`${action} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <FiRefreshCw size={12} />
                    Renew
                  </button>
                )}

                <button
                  type="button"
                  disabled={busyId === listing.id}
                  onClick={() => remove(listing.id)}
                  className={`${action} text-gray-500 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <FiTrash2 size={12} />
                  {busyId === listing.id ? "Working…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

export default MyListings;

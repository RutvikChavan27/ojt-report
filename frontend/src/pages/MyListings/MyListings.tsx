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
import ListingRowSkeleton from "../../components/common/ListingRowSkeleton";
import ImageWithLoader from "../../components/common/ImageWithLoader";
import { formatPrice, relativeTime } from "../../lib/format";
import {
  deleteListing,
  fetchMyListings,
  markListingSold,
  renewListing,
} from "../../lib/api";
import { useApi } from "../../hooks/useApi";
import { usePageGate } from "../../store/RouteGate";
import { useConfirm } from "../../store/ConfirmContext";
import BackLink from "../../components/common/BackLink";

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
  active: "bg-emerald-50 text-emerald-700",
  sold: "bg-sand text-charcoal-600",
  expired: "bg-amber-50 text-amber-700",
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
  const confirm = useConfirm();

  const { data, loading, error, reload } = useApi(fetchMyListings, []);

  /* First load only. The refetch after each sold/renew/delete leaves the table on
     screen, so gating on `loading` alone would black out the dashboard every time
     a seller pressed a button. */
  usePageGate(loading && !data);

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

  const renew = (id: string) => run(id, () => renewListing(id));

  /* Marking sold takes a listing out of the marketplace, so it asks first — but
     it is reversible from the Renew button, which is why it is not `danger`. */
  const markSold = async (id: string) => {
    const ok = await confirm({
      title: "Mark as sold?",
      message:
        "This removes the listing from search results. You can put it back later with Renew.",
      confirmLabel: "Mark as sold",
    });
    if (!ok) return;
    return run(id, () => markListingSold(id));
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: "Delete listing?",
      message: "Are you sure you want to delete this listing? This cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    return run(id, () => deleteListing(id));
  };

  const action =
    "flex items-center gap-1.5 rounded-full border border-taupe px-3 py-1.5 text-xs font-bold text-charcoal-900 transition hover:border-charcoal-400 hover:text-charcoal-900";

  return (
    <Container className="py-8" narrow="lg">
      <BackLink className="mb-4" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-charcoal-900 sm:text-2xl">
            My listings
          </h1>
          <p className="mt-1 text-sm text-charcoal-500">
            Manage what you have posted.
          </p>
        </div>

        <Link
          to="/post-ad"
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#00c9ff] to-[#92fe9d] px-5 py-2.5 text-sm font-bold text-charcoal-900 transition hover:shadow-md hover:shadow-mint-500/30 hover:brightness-105"
        >
          <FiPlus size={15} />
          Sell Something
        </Link>
      </div>

      {/* Status tabs */}
      <div
        role="tablist"
        aria-label="Listing status"
        className="mt-6 flex gap-2 border-b border-taupe"
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
                ? "border-mint-500 text-mint-700"
                : "border-transparent text-charcoal-500 hover:text-mint-600"
            }`}
          >
            {STATUS_LABEL[status]} ({countFor(status)})
          </button>
        ))}
      </div>

      {actionError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700"
        >
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <ListingRowSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="mt-8">
          <EmptyState title="Could not load your listings" description={error}>
            <button
              type="button"
              onClick={reload}
              className="inline-flex rounded-full bg-gradient-to-r from-[#00c9ff] to-[#92fe9d] px-6 py-2.5 text-sm font-bold text-charcoal-900 transition hover:shadow-md hover:shadow-mint-500/30 hover:brightness-105"
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
                ? "Sell something and it will show up here."
                : `Nothing here yet.`
            }
          >
            {tab === "active" && (
              <Link
                to="/post-ad"
                className="inline-flex rounded-full bg-gradient-to-r from-[#00c9ff] to-[#92fe9d] px-6 py-2.5 text-sm font-bold text-charcoal-900 transition hover:shadow-md hover:shadow-mint-500/30 hover:brightness-105"
              >
                Sell Something
              </Link>
            )}
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((listing) => (
            <li
              key={listing.id}
              className="overflow-hidden rounded-2xl border border-taupe bg-gradient-to-br from-cyan-50 to-mint-50"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row">
                <Link
                  to={`/listing/${listing.id}`}
                  className="relative h-28 w-full flex-shrink-0 overflow-hidden rounded-xl bg-sand sm:w-40"
                >
                  <ImageWithLoader
                    src={listing.image}
                    alt={listing.title}
                    skeletonRounded="xl"
                    className="h-full w-full object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      to={`/listing/${listing.id}`}
                      className="text-sm font-bold text-charcoal-900 hover:underline"
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

                  <p className="mt-1 text-base font-black text-charcoal-900">
                    {formatPrice(listing.price)}
                  </p>

                  <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-charcoal-500">
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

              <div className="flex flex-wrap gap-2 border-t border-taupe px-4 py-3">
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
                  className={`${action} text-charcoal-500 hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50`}
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

import { Link, useParams } from "react-router-dom";
import Container from "../../components/layout/Container";
import {
  FiAlertTriangle,
  FiCalendar,
  FiEye,
  FiHeart,
  FiMapPin,
  FiTag,
} from "react-icons/fi";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import EmptyState from "../../components/common/EmptyState";
import ListingDetailsSkeleton from "../../components/common/ListingDetailsSkeleton";
import ListingGallery from "../../components/listings/ListingGallery";
import ListingGrid from "../../components/listings/ListingGrid";
import SellerCard from "../../components/listings/SellerCard";
import { formatPrice, placeLabel, relativeTime } from "../../lib/format";
import { fetchListing, searchListings } from "../../lib/api";
import { useApi } from "../../hooks/useApi";
import { usePageGate } from "../../store/RouteGate";
import BackLink from "../../components/common/BackLink";
import { useSavedListings } from "../../store/SavedListingsContext";

/** How many other listings from the same category to show underneath. */
const RELATED_COUNT = 4;

/**
 * One listing in full: photos, the facts, and how to reach the seller.
 *
 * There is no purchase flow. On a classifieds site the transaction happens
 * between two people offline, so the strongest action this page can offer is
 * "contact the seller".
 */
function ListingDetails() {
  const { id } = useParams<{ id: string }>();
  const { isSaved, toggle } = useSavedListings();

  /* Fetched by id rather than carried over from the grid: opening a listing
     from a link or a reload has no previous object to reuse, and the detail
     response holds fields the card never had (description, all photos, the
     seller, the view count). */
  const {
    data: listing,
    loading,
    error,
  } = useApi(() => fetchListing(id ?? ""), [id]);

  /* Opening a listing is a fresh page, so the branded loader holds until the
     listing itself is in. Only the listing gates it, not the related row below:
     that is secondary content and its own grid skeleton covers it, so waiting on
     a second request here would keep the page hidden longer than it needs to be. */
  usePageGate(loading && !listing);

  /* Same category, excluding this one — plain category navigation, not a
     recommendation engine (which the brief puts out of scope). Asks for one
     extra so removing this listing still leaves a full row. */
  const { data: relatedResult } = useApi(
    () =>
      listing
        ? searchListings({
            category: listing.category,
            perPage: RELATED_COUNT + 1,
          })
        : Promise.resolve(null),
    [listing?.category],
  );

  const related = (relatedResult?.items ?? [])
    .filter((entry) => entry.id !== id)
    .slice(0, RELATED_COUNT);

  if (loading) {
    return (
      <Container className="py-8">
        <ListingDetailsSkeleton />
      </Container>
    );
  }

  if (error || !listing) {
    return (
      <Container className="py-16" narrow="md">
        <EmptyState
          as="h1"
          title="Listing not found"
          description="It may have been sold, expired, or the link is wrong."
        >
          <Link
            to="/search"
            className="inline-flex rounded-full bg-gradient-to-r from-[#00c9ff] to-[#92fe9d] px-6 py-2.5 text-sm font-bold text-charcoal-900 transition hover:shadow-md hover:shadow-cyan-500/30 hover:brightness-105"
          >
            Browse all listings
          </Link>
        </EmptyState>
      </Container>
    );
  }

  const saved = isSaved(listing.id);

  const facts: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <FiTag size={14} />, label: "Condition", value: listing.condition },
    {
      icon: <FiMapPin size={14} />,
      label: "Location",
      value: placeLabel(listing.location, listing.city),
    },
    {
      icon: <FiCalendar size={14} />,
      label: "Posted",
      value: relativeTime(listing.postedAt),
    },
    {
      icon: <FiEye size={14} />,
      label: "Views",
      value: listing.viewCount.toLocaleString("en-IN"),
    },
  ];

  return (
    <Container className="py-8">
      <Breadcrumbs
        trail={[
          { label: "Home", to: "/home" },
          {
            label: listing.categoryLabel,
            to: `/search?category=${listing.category}`,
          },
          { label: listing.title },
        ]}
      />

      {/* Falls back to this listing's own category when opened from a shared
          link, which is nearer than the homepage to where "results" implies. */}
      <BackLink
        label="Back to results"
        fallbackTo={`/search?category=${listing.category}`}
        className="mb-6 mt-4"
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        {/* Left: photos, then the detail */}
        <div className="min-w-0">
          <ListingGallery images={listing.images} alt={listing.title} />

          <div className="mt-8">
            <h1 className="text-xl font-black leading-snug tracking-tight text-charcoal-900 sm:text-2xl">
              {listing.title}
            </h1>
            <p className="mt-2 text-2xl font-black tracking-tight text-charcoal-900">
              {formatPrice(listing.price)}
            </p>

            <Link
              to={`/category/${listing.category}`}
              className="mt-3 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100"
            >
              {listing.categoryLabel}
            </Link>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-taupe bg-gradient-to-br from-cyan-50 to-mint-50 p-5 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="flex items-center gap-1.5 text-xs text-charcoal-400">
                  {fact.icon}
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm font-bold text-charcoal-900">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <section className="mt-8">
            <h2 className="text-sm font-black uppercase tracking-wide text-charcoal-900">
              Description
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal-600">
              {listing.description}
            </p>
          </section>

          <section className="mt-8 flex items-start gap-3 rounded-2xl border border-taupe p-5">
            <FiAlertTriangle
              size={18}
              className="mt-0.5 flex-shrink-0 text-amber-600"
            />
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">Stay safe</h2>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-charcoal-600">
                <li>Meet the seller in a public place.</li>
                <li>Check the item thoroughly before paying.</li>
                <li>Never pay a deposit or advance before seeing the item.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Right: the actions, kept in view while the detail is read */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SellerCard seller={listing.seller} />

          <button
            type="button"
            onClick={() => toggle(listing.id)}
            aria-pressed={saved}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-bold transition ${
              saved
                ? "border-cyan-500 bg-cyan-500 text-charcoal-900"
                : "border-taupe text-charcoal-900 hover:border-cyan-400 hover:text-cyan-700"
            }`}
          >
            <FiHeart size={15} fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save listing"}
          </button>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-lg font-black tracking-tight text-charcoal-900">
              More in {listing.categoryLabel}
            </h2>
            <Link
              to={`/category/${listing.category}`}
              className="text-sm font-bold text-charcoal-900 transition hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-5">
            <ListingGrid listings={related} />
          </div>
        </section>
      )}
    </Container>
  );
}

export default ListingDetails;

import { Link } from "react-router-dom";
import Container from "../../components/layout/Container";
import EmptyState from "../../components/common/EmptyState";
import ListingGrid from "../../components/listings/ListingGrid";
import { fetchListing, type ApiListingDetail } from "../../lib/api";
import { useApi } from "../../hooks/useApi";
import { useSavedListings } from "../../store/SavedListingsContext";

/**
 * Listings the visitor has saved.
 *
 * Which ids are saved lives on the device (localStorage) — there is no
 * server-side saved-listings table, so this is per-browser by design. The
 * listings behind those ids come from the API, so a saved listing always shows
 * today's price rather than the one it had when it was saved.
 *
 * Fetched one id at a time because there is no bulk endpoint; `allSettled`
 * means a listing that has since been deleted drops out quietly instead of
 * failing the whole page.
 */
function SavedListings() {
  const { ids } = useSavedListings();

  const { data, loading } = useApi<ApiListingDetail[]>(async () => {
    if (ids.length === 0) return [];
    const results = await Promise.allSettled(ids.map((id) => fetchListing(id)));
    return results
      .filter(
        (result): result is PromiseFulfilledResult<ApiListingDetail> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);
  }, [ids.join(",")]);

  const saved = data ?? [];

  return (
    <Container className="py-8">
      <h1 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
        Saved listings
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {saved.length} {saved.length === 1 ? "listing" : "listings"} saved on this
        device.
      </p>

      <div className="mt-6">
        {loading ? (
          <ListingGrid listings={[]} loading skeletonCount={ids.length || 4} />
        ) : saved.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            description="Tap the heart on any listing to keep it here while you decide."
          >
            <Link
              to="/search"
              className="inline-flex rounded-full bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-black"
            >
              Browse listings
            </Link>
          </EmptyState>
        ) : (
          <ListingGrid listings={saved} />
        )}
      </div>
    </Container>
  );
}

export default SavedListings;

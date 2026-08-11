import { useEffect, useState } from "react";
import { FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ListingCard from "../../components/listings/ListingCard";
import { fetchListings, type Listing } from "../../lib/api";
import { useApi } from "../../hooks/useApi";

const PER_PAGE = 24;

type CategoryListingsProps = {
  categorySlug: string;
  categoryLabel: string;
  audience: string;
  onBack: () => void;
  onSelectListing: (listing: Listing) => void;
};

/**
 * Every active listing in one category, 24 to a page. Paging is server-side —
 * the category holds thousands of rows, so fetching them all to slice in the
 * browser is not an option.
 */
function CategoryListings({
  categorySlug,
  categoryLabel,
  audience,
  onBack,
  onSelectListing,
}: CategoryListingsProps) {
  const [page, setPage] = useState(1);

  // A different category is a different result set; start at page one.
  useEffect(() => {
    setPage(1);
  }, [categorySlug, audience]);

  const { data, loading, error } = useApi(
    () => fetchListings({ category: categorySlug, audience, page, perPage: PER_PAGE }),
    [categorySlug, audience, page],
  );

  const listings = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), pageCount));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="pb-20 pt-8">
      <div className="mx-auto w-full px-6 sm:px-10 lg:px-16">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
        >
          <FiArrowLeft size={16} />
          Back
        </button>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-base font-bold tracking-tight text-gray-900">
            {categoryLabel}
          </h1>
          {!loading && !error && (
            <p className="text-sm text-gray-500">
              {total.toLocaleString("en-IN")} {total === 1 ? "listing" : "listings"}
              {pageCount > 1 ? ` · page ${page} of ${pageCount.toLocaleString("en-IN")}` : ""}
            </p>
          )}
        </div>

        {error ? (
          <p className="mt-10 text-sm text-gray-500">Couldn’t load listings. {error}</p>
        ) : loading ? (
          <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: PER_PAGE }).map((_, index) => (
              <div key={index}>
                <div className="aspect-[3/4] animate-pulse rounded-2xl bg-gray-200" />
                <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500">
              Nothing listed in {categoryLabel} right now.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-4 rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-black/5"
            >
              Browse other categories
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onSelect={onSelectListing}
                />
              ))}
            </div>

            {pageCount > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => goToPage(page - 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft size={16} />
                </button>

                <span className="text-sm font-semibold text-gray-900">
                  {page} / {pageCount.toLocaleString("en-IN")}
                </span>

                <button
                  type="button"
                  aria-label="Next page"
                  disabled={!data?.hasMore}
                  onClick={() => goToPage(page + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default CategoryListings;

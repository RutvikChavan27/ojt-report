import { useMemo, useState } from "react";
import Container from "../../components/layout/Container";
import { useSearchParams } from "react-router-dom";
import { FiBookmark, FiSliders, FiX } from "react-icons/fi";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import CategoryStrip from "../../components/categories/CategoryStrip";
import SavedSearchesMenu from "../../components/search/SavedSearchesMenu";
import EmptyState from "../../components/common/EmptyState";
import ListingGridSkeleton from "../../components/common/ListingGridSkeleton";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import FilterDrawer from "../../components/filters/FilterDrawer";
import FilterSidebar from "../../components/filters/FilterSidebar";
import ListingGrid from "../../components/listings/ListingGrid";
import Pagination from "../../components/search/Pagination";
import SortDropdown from "../../components/search/SortDropdown";
import {
  describeFilters,
  paramsFromSearch,
  searchToParams,
  type SearchParams,
} from "../../lib/search";
import { searchListingsViaApi } from "../../lib/searchApi";
import { fetchCategories } from "../../lib/api";
import { useApi } from "../../hooks/useApi";
import { useLoadingState } from "../../hooks/useLoadingState";
import { usePageGate } from "../../store/RouteGate";
import { useAuth } from "../../store/AuthContext";
import { useSavedSearches } from "../../store/SavedSearchesContext";

/**
 * The search results page — the core of the marketplace.
 *
 * The URL is the only place the current search is stored. Every control writes
 * to it and the page reads back out of it, which is what makes a result page
 * bookmarkable, shareable, reload-safe and correct under the back button. Held
 * in component state instead, all four of those would quietly break.
 */
function SearchResults() {
  const [search, setSearch] = useSearchParams();
  const { user } = useAuth();
  const { save } = useSavedSearches();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const params = useMemo(() => paramsFromSearch(search), [search]);

  /* Matching, faceting, sorting and paging are the server's job now. The URL
     remains the only place the search is stored, so its query string is what
     the request is rebuilt from whenever it changes. */
  const key = search.toString();
  const { data, loading } = useApi(() => searchListingsViaApi(params), [key]);

  /* Two distinct loading shapes. The very first search has nothing to show, so
     it renders a skeleton grid. Every search after that (a new filter, sort or
     page) already has results on screen, so those stay and are dimmed under an
     "updating" overlay rather than being thrown away and rebuilt — which is
     what made each filter click feel like a full reload. The overlay is gated
     on a short delay so an instant refetch never flashes it. */
  const { showSkeleton, showOverlay } = useLoadingState(loading, Boolean(data));

  /* Arriving from a category tile or the search box is a fresh page with nothing
     to show, so the branded loader covers the viewport until the first results
     are in. Gated on showSkeleton rather than `loading`: a filter, sort or page
     change already has results on screen and keeps the dimmed overlay below,
     which a full-screen takeover on every click would replace. */
  usePageGate(showSkeleton);

  const { data: categories } = useApi(() => fetchCategories(), []);

  /* An empty result while the first request is in flight, so every reader below
     can stay written against a plain object rather than a nullable one. The
     grid shows skeletons off `loading`, not off an empty list. */
  const results = data ?? {
    items: [],
    total: 0,
    page: params.page,
    perPage: 12,
    pageCount: 1,
    suggestion: null,
    facets: { category: [], city: [], condition: [], price: [] },
  };

  const chips = describeFilters(params);

  /** Home / <Category> / "<query>" — whichever parts of that apply. */
  const categoryLabel = params.category
    ? ((categories ?? []).find((entry) => entry.slug === params.category)
        ?.label ?? params.category)
    : null;

  const trail = [
    { label: "Home", to: "/home" },
    ...(categoryLabel
      ? [{ label: categoryLabel, to: `/search?category=${params.category}` }]
      : []),
    ...(params.q ? [{ label: `"${params.q}"` }] : []),
    ...(!categoryLabel && !params.q ? [{ label: "All listings" }] : []),
  ];

  /**
   * Applies a change to the search.
   *
   * Any change other than paging resets to page one: after narrowing the
   * results, page 7 of the old search may not exist, and landing on an empty
   * page reads as "no results" when there are plenty.
   */
  const update = (patch: Partial<SearchParams>) => {
    const next: SearchParams = { ...params, ...patch };
    const changingPage = "page" in patch;
    if (!changingPage) next.page = 1;

    /*
     * Filters and sort replace the current history entry; only paging pushes a
     * new one.
     *
     * Pushing on every filter change buried the rest of history: ticking six
     * boxes meant six presses of Back to get off the results page, each one
     * silently undoing a single checkbox. Replacing keeps Back meaning "leave
     * this search", which is what people expect, while the URL still holds the
     * complete state so a result page is bookmarkable and reload-safe (§4C).
     *
     * Paging is the exception — Back returning to the previous page of results
     * is genuinely useful, and it is one entry per page rather than per click.
     */
    setSearch(searchToParams(next), { replace: !changingPage });
    setSavedNotice(false);
  };

  /** Removes one filter, leaving the rest untouched. */
  const clearChip = (key: string) => {
    if (key.startsWith("condition:")) {
      const value = key.slice("condition:".length);
      update({ conditions: params.conditions.filter((entry) => entry !== value) });
      return;
    }
    if (key === "price") {
      update({ priceBand: null, minPrice: null, maxPrice: null });
      return;
    }
    update({ [key]: null } as Partial<SearchParams>);
  };

  const clearAll = () =>
    update({
      category: null,
      city: null,
      conditions: [],
      priceBand: null,
      minPrice: null,
      maxPrice: null,
      postedWithinDays: null,
    });

  const handleSaveSearch = () => {
    const name =
      [params.q || "All listings", params.city].filter(Boolean).join(" in ") ||
      "All listings";
    save(name, searchToParams(params).toString());
    setSavedNotice(true);
  };

  return (
    <Container className="py-8">
      {/* No search box here: the header carries one on every page except the
         homepage, and two on a narrow screen was one too many. */}

      {/* Switch category without losing the rest of the search, with saved
          searches beside it. `min-w-0` lets the strip scroll inside the flex row
          rather than forcing the row wider than the page and pushing the menu
          off-screen. */}
      <div className="flex items-start gap-2 border-b border-gray-200">
        <div className="min-w-0 flex-1">
          <CategoryStrip bare />
        </div>
        <SavedSearchesMenu />
      </div>

      <div className="mt-5">
        <Breadcrumbs trail={trail} />
      </div>

      <div className="mt-3">
        <h1 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
          {params.q ? `Results for "${params.q}"` : "All listings"}
        </h1>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {results.total.toLocaleString("en-IN")}{" "}
            {results.total === 1 ? "listing" : "listings"}
            {params.city ? ` in ${params.city}` : ""}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 lg:hidden"
            >
              <FiSliders size={14} />
              Filters{chips.length > 0 && ` (${chips.length})`}
            </button>

            <SortDropdown
              value={params.sort}
              onChange={(sort) => update({ sort })}
              hasQuery={Boolean(params.q)}
            />
          </div>
        </div>
      </div>

      {/* Applied filters, each removable on its own */}
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => clearChip(chip.key)}
              className="flex items-center gap-1.5 rounded-full bg-black/[0.06] px-3 py-1.5 text-xs font-semibold text-gray-900 transition hover:bg-black/[0.1]"
            >
              {chip.label}
              <FiX size={12} />
            </button>
          ))}

          <button
            type="button"
            onClick={clearAll}
            className="px-2 text-xs font-semibold text-gray-500 transition hover:text-gray-900"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <FilterSidebar
            params={params}
            facets={results.facets}
            onChange={update}
            onClearAll={clearAll}
            activeCount={chips.length}
          />

          {/* Saving a search needs an account (§4A) */}
          <div className="mt-6 border-t border-gray-200 pt-5">
            {savedNotice ? (
              <p className="text-sm font-semibold text-gray-900">
                Saved. See it under Saved searches.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleSaveSearch}
                disabled={!user}
                title={user ? undefined : "Log in to save a search"}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-900 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
              >
                <FiBookmark size={14} />
                Save this search
              </button>
            )}
            {!user && (
              <p className="mt-2 text-xs text-gray-400">
                Log in to save searches and get a count of new matches.
              </p>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {showSkeleton ? (
            <ListingGridSkeleton count={12} />
          ) : results.total === 0 ? (
            <EmptyState
              title="No listings found"
              description={
                results.suggestion
                  ? undefined
                  : "Try a different keyword, a wider price range, or another category."
              }
            >
              <div className="space-y-4">
                {results.suggestion && (
                  <p className="text-sm text-gray-500">
                    Did you mean{" "}
                    <button
                      type="button"
                      onClick={() => update({ q: results.suggestion ?? "" })}
                      className="font-bold text-gray-900 underline decoration-gray-400 underline-offset-2 transition hover:decoration-gray-900"
                    >
                      {results.suggestion}
                    </button>
                    ?
                  </p>
                )}

                {chips.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Try removing a filter:</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {chips.map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => clearChip(chip.key)}
                          className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 transition hover:border-gray-900"
                        >
                          {chip.label}
                          <FiX size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </EmptyState>
          ) : (
            <LoadingOverlay active={showOverlay}>
              <ListingGrid listings={results.items} />
              <Pagination
                page={results.page}
                pageCount={results.pageCount}
                onChange={(page) => {
                  update({ page });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </LoadingOverlay>
          )}
        </div>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        params={params}
        facets={results.facets}
        onChange={update}
        onClearAll={clearAll}
        activeCount={chips.length}
        total={results.total}
      />
    </Container>
  );
}

export default SearchResults;

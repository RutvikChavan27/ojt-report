import { Link, useNavigate } from "react-router-dom";
import Container from "../../components/layout/Container";
import { FiBookmark, FiTrash2 } from "react-icons/fi";
import EmptyState from "../../components/common/EmptyState";
import { describeFilters, paramsFromSearch } from "../../lib/search";
import { useSavedSearches } from "../../store/SavedSearchesContext";

/**
 * Saved searches, each with how many listings have appeared since it was last
 * checked.
 *
 * Opening one restores the exact search by navigating to its stored query
 * string, and resets the "new" count — the badge means "since you last looked",
 * so looking has to clear it.
 */
function SavedSearches() {
  const navigate = useNavigate();
  const { searches, remove, newCount, markChecked } = useSavedSearches();

  if (searches.length === 0) {
    return (
      <Container className="py-16" narrow="md">
        <EmptyState
          as="h1"
          title="No saved searches yet"
          description="Run a search, then save it to track new listings that match — useful for something you are waiting to come up."
        >
          <Link
            to="/search"
            className="inline-flex rounded-full bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-black"
          >
            Start searching
          </Link>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container className="py-8" narrow="lg">
      <h1 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
        Saved searches
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {searches.length} saved. New matches are counted since you last opened
        each one.
      </p>

      <ul className="mt-6 space-y-4">
        {searches.map((entry) => {
          const params = paramsFromSearch(new URLSearchParams(entry.query));
          const chips = describeFilters(params);
          const fresh = newCount(entry);

          return (
            <li
              key={entry.id}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <FiBookmark size={14} className="flex-shrink-0" />
                    {entry.name}
                  </h2>

                  {params.q && (
                    <p className="mt-1 text-xs text-gray-500">
                      Keyword: <span className="font-semibold">{params.q}</span>
                    </p>
                  )}
                </div>

                {fresh > 0 && (
                  <span className="rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    {fresh} new
                  </span>
                )}
              </div>

              {chips.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <span
                      key={chip.key}
                      className="rounded-full bg-black/[0.06] px-2.5 py-1 text-xs font-semibold text-gray-700"
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-3 text-xs text-gray-400">
                Last checked{" "}
                {new Date(entry.lastCheckedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    markChecked(entry.id);
                    navigate(`/search?${entry.query}`);
                  }}
                  className="rounded-full bg-gray-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-black"
                >
                  View results
                </button>

                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-xs font-bold text-gray-500 transition hover:border-gray-900 hover:text-gray-900"
                >
                  <FiTrash2 size={12} />
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}

export default SavedSearches;

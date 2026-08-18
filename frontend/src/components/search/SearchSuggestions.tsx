import { FiClock, FiSearch, FiX } from "react-icons/fi";
import type { ApiSuggestion } from "../../lib/api";
import type { RecentSearch } from "../../store/RecentSearchesContext";

type SearchSuggestionsProps = {
  /** Live matches from the database. Empty while the box is empty. */
  suggestions: ApiSuggestion[];
  /** This browser's previous queries, newest first. */
  recent: RecentSearch[];
  /** True while a lookup for the current text is still in flight. */
  loading?: boolean;
  /** The chosen text becomes the query. */
  onPick: (query: string) => void;
  /** Drops one past search from the list. */
  onRemoveRecent: (query: string) => void;
  onClearRecent: () => void;
};

/**
 * The dropdown under the search box: past searches, or live suggestions.
 *
 * Which one shows depends on whether anything has been typed. An empty box means
 * the person has not said what they want yet, so their own history is the most
 * useful thing to offer; once there is text, matches from the database are.
 *
 * Suggestions show only the listing name — a plain list to pick from. Sellers
 * write titles as "<item> — <descriptor>" ("… — Excellent Condition", "… —
 * Plum"), so the descriptor after the em-dash is dropped for display, leaving
 * the item itself. The API still returns price and category (used elsewhere);
 * the dropdown keeps to the name so it reads as suggestions rather than results.
 */
function SearchSuggestions({
  suggestions,
  recent,
  loading = false,
  onPick,
  onRemoveRecent,
  onClearRecent,
}: SearchSuggestionsProps) {
  const showingRecent = suggestions.length === 0 && recent.length > 0;

  /* The name shown for a suggestion: the title up to its first em-dash, so the
     seller's trailing descriptor drops off. Only the em-dash (—) is cut, never a
     plain hyphen, so names like "Wi-Fi" survive. Two titles can trim to the same
     name (two "Used iPhone 13 Pro 128GB" listings), so the list is deduped while
     keeping the order the server returned. */
  const suggestionNames = Array.from(
    new Set(suggestions.map((item) => item.title.split("—")[0].trim())),
  );

  // Nothing to offer, and nothing in flight worth announcing.
  if (suggestions.length === 0 && recent.length === 0 && !loading) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      {showingRecent && (
        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
            Recent searches
          </span>
          <button
            type="button"
            onMouseDown={(event) => {
              // The input's blur closes this list; preventing default keeps focus
              // so the dropdown survives and the cleared state is visible.
              event.preventDefault();
              onClearRecent();
            }}
            className="text-[11px] font-bold text-gray-400 transition hover:text-gray-900"
          >
            Clear all
          </button>
        </div>
      )}

      <ul role="listbox">
        {showingRecent &&
          recent.map((entry) => (
            <li key={entry.query} className="group flex items-center">
              <button
                type="button"
                role="option"
                aria-selected={false}
                // onMouseDown, not onClick: the input's blur fires first and
                // would unmount this list before a click could land.
                onMouseDown={() => onPick(entry.query)}
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left transition hover:bg-black/[0.03]"
              >
                <FiClock size={14} className="flex-shrink-0 text-gray-400" />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
                  {entry.query}
                </span>
              </button>

              <button
                type="button"
                aria-label={`Remove ${entry.query} from recent searches`}
                onMouseDown={(event) => {
                  // Must not also trigger the row behind it, and must not blur.
                  event.preventDefault();
                  event.stopPropagation();
                  onRemoveRecent(entry.query);
                }}
                className="mr-2 flex-shrink-0 rounded-full p-2 text-gray-300 transition hover:bg-black/5 hover:text-gray-900"
              >
                <FiX size={14} />
              </button>
            </li>
          ))}

        {suggestionNames.map((name) => (
          <li key={name}>
            <button
              type="button"
              role="option"
              aria-selected={false}
              // Picks the trimmed name, so the box and the search that runs match
              // what was shown rather than the longer stored title.
              onMouseDown={() => onPick(name)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-black/[0.03]"
            >
              <FiSearch size={14} className="flex-shrink-0 text-gray-400" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
                {name}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Only announced when there is nothing else on screen, so the list does
          not jump as results replace a spinner mid-type. */}
      {loading && suggestions.length === 0 && !showingRecent && (
        <p className="px-4 py-3 text-sm text-gray-400">Searching…</p>
      )}
    </div>
  );
}

export default SearchSuggestions;

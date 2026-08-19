import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import SearchSuggestions from "./SearchSuggestions";
import { fetchSuggestions, type ApiSuggestion } from "../../lib/api";
import { useRecentSearches } from "../../store/RecentSearchesContext";

type SearchBarProps = {
  /** Seeds the box, e.g. when landing on /search?q=iphone. */
  initialQuery?: string;
  /** Carried through so searching from the navbar keeps the chosen city. */
  city?: string | null;
  size?: "default" | "large";
  placeholder?: string;
};

/** Typing should not fire a lookup per keystroke. */
const DEBOUNCE_MS = 250;

/** Below this, a query matches too much of the table to be a useful hint. */
const MIN_QUERY = 2;

/**
 * The search box, with debounced type-ahead suggestions from the database.
 *
 * Submitting navigates to /search with the query in the URL rather than holding
 * it in state — the URL is the source of truth for a search, which is what makes
 * a result page shareable and survive a reload.
 *
 * Suggestions come from `/api/search/suggest`, so they reflect the listings that
 * actually exist. Focusing an empty box shows this browser's recent searches
 * instead, which is the only useful thing to offer before anything is typed.
 */
function SearchBar({
  initialQuery = "",
  city = null,
  size = "default",
  placeholder = "Search for cars, phones, furniture, clothes...",
}: SearchBarProps) {
  const navigate = useNavigate();
  const { recent, record, remove, clear } = useRecentSearches();
  const [value, setValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<ApiSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep in step when the URL changes underneath (back button, a chip cleared).
  useEffect(() => setValue(initialQuery), [initialQuery]);

  /* Debounced, aborted lookup.
   *
   * The AbortController is the important half: a debounce alone still allows a
   * slow reply for "iph" to arrive after a fast one for "iphone" and repopulate
   * the list with matches for text no longer in the box. Cancelling the previous
   * request on each change makes the last one typed the last one applied. */
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timeout = setTimeout(() => {
      fetchSuggestions(trimmed, controller.signal)
        .then(setSuggestions)
        .catch(() => {
          // Aborted, or the lookup failed. Either way the box shows nothing
          // extra rather than an error while someone is mid-word.
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  const runSearch = (query: string) => {
    const trimmed = query.trim();
    const search = new URLSearchParams();
    if (trimmed) search.set("q", trimmed);
    if (city) search.set("city", city);

    // Recorded here rather than on the results page: this is the one place that
    // knows the search was deliberately started, as opposed to a URL being
    // opened, reloaded or arrived at with the back button.
    record(trimmed);

    setOpen(false);
    navigate(`/search?${search.toString()}`);
  };

  const tall = size === "large";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        runSearch(value);
      }}
      className="relative w-full"
      role="search"
    >
      <div
        className={`flex w-full items-center gap-2 rounded-full border border-taupe bg-gradient-to-br from-cyan-50 to-mint-50 pl-4 shadow-sm transition-all duration-200 focus-within:border-cyan-500 focus-within:shadow-md focus-within:ring-2 focus-within:ring-cyan-500/20 ${
          tall ? "py-1.5 pr-1.5" : "py-1 pr-1"
        }`}
      >
        <FiSearch size={tall ? 17 : 15} className="flex-shrink-0 text-charcoal-400" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder={placeholder}
          aria-label="Search listings"
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-charcoal-400 ${
            tall ? "text-base" : "text-sm"
          }`}
        />

        {/* Only present when there is something to clear, so the pill does not
            carry a dead control. Focus returns to the input afterwards: clearing
            is nearly always the start of typing something else, and a cleared box
            that has lost focus makes you click it again. */}
        {value !== "" && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setSuggestions([]);
              inputRef.current?.focus();
              setOpen(true);
            }}
            aria-label="Clear search"
            title="Clear search"
            className="flex-shrink-0 rounded-full p-1.5 text-charcoal-400 transition hover:bg-sand hover:text-charcoal-900"
          >
            <FiX size={tall ? 17 : 15} />
          </button>
        )}

        <button
          type="submit"
          className={`flex-shrink-0 rounded-full bg-gradient-to-r from-[#00c9ff] to-[#92fe9d] font-bold text-charcoal-900 shadow-sm shadow-cyan-500/30 transition-all duration-150 ease-out hover:shadow-md hover:shadow-mint-500/40 hover:brightness-105 hover:-translate-y-px active:translate-y-0 active:scale-95 motion-reduce:transform-none ${
            tall ? "px-7 py-2.5 text-sm" : "px-5 py-2 text-sm"
          }`}
        >
          Search
        </button>
      </div>

      {open && (
        <SearchSuggestions
          suggestions={suggestions}
          // Only offered when the box is empty; once there is text, live matches
          // are the more useful list.
          // Up to five of the most recent; storage keeps more, the dropdown shows a tidy few.
          recent={value.trim() ? [] : recent.slice(0, 5)}
          loading={loading}
          onPick={(query) => {
            setValue(query);
            runSearch(query);
          }}
          onRemoveRecent={remove}
          onClearRecent={clear}
        />
      )}
    </form>
  );
}

export default SearchBar;

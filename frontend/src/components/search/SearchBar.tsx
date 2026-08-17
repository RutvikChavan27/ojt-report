import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import SearchSuggestions from "./SearchSuggestions";
import { suggestTitles } from "../../lib/search";
import type { Listing } from "../../data/marketplace";

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

/**
 * The search box, with debounced type-ahead suggestions.
 *
 * Submitting navigates to /search with the query in the URL rather than holding
 * it in state — the URL is the source of truth for a search, which is what makes
 * a result page shareable and survive a reload.
 */
function SearchBar({
  initialQuery = "",
  city = null,
  size = "default",
  placeholder = "Search for cars, phones, furniture, clothes...",
}: SearchBarProps) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Listing[]>([]);
  const [open, setOpen] = useState(false);

  // Keep in step when the URL changes underneath (back button, a chip cleared).
  useEffect(() => setValue(initialQuery), [initialQuery]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setSuggestions(suggestTitles(value)),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [value]);

  const runSearch = (query: string) => {
    const search = new URLSearchParams();
    if (query.trim()) search.set("q", query.trim());
    if (city) search.set("city", city);

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
        className={`flex w-full items-center gap-2 rounded-full border border-gray-300 bg-white pl-4 transition focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900/10 ${
          tall ? "py-1.5 pr-1.5" : "py-1 pr-1"
        }`}
      >
        <FiSearch size={tall ? 17 : 15} className="flex-shrink-0 text-gray-400" />

        <input
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
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-gray-400 ${
            tall ? "text-base" : "text-sm"
          }`}
        />

        <button
          type="submit"
          className={`flex-shrink-0 rounded-full bg-gray-900 font-bold text-white transition hover:bg-black ${
            tall ? "px-5 py-2 text-[13px]" : "px-4 py-1.5 text-[13px]"
          }`}
        >
          Search
        </button>
      </div>

      {open && (
        <SearchSuggestions
          suggestions={suggestions}
          onPick={(title) => {
            setValue(title);
            runSearch(title);
          }}
        />
      )}
    </form>
  );
}

export default SearchBar;

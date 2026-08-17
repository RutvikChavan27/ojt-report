import { FiSearch } from "react-icons/fi";
import type { Listing } from "../../data/marketplace";
import { formatPrice } from "../../data/marketplace";

type SearchSuggestionsProps = {
  suggestions: Listing[];
  /** Called with the chosen title, which then becomes the query. */
  onPick: (title: string) => void;
};

/**
 * The type-ahead dropdown under the search box.
 *
 * Shows matching listing titles rather than bare keywords, because a title with
 * its price attached tells you whether it is worth pursuing before you search.
 */
function SearchSuggestions({ suggestions, onPick }: SearchSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <ul
      role="listbox"
      className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
    >
      {suggestions.map((listing) => (
        <li key={listing.id}>
          <button
            type="button"
            role="option"
            aria-selected={false}
            // onMouseDown, not onClick: the input's blur fires first and would
            // unmount this list before a click could land.
            onMouseDown={() => onPick(listing.title)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-black/[0.03]"
          >
            <FiSearch size={14} className="flex-shrink-0 text-gray-400" />
            <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
              {listing.title}
            </span>
            <span className="flex-shrink-0 text-xs font-semibold text-gray-500">
              {formatPrice(listing.price)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default SearchSuggestions;

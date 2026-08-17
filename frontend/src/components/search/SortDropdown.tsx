import { SORT_OPTIONS, type SortKey } from "../../lib/search";

type SortDropdownProps = {
  value: SortKey;
  onChange: (sort: SortKey) => void;
  /** Relevance needs a query to rank against. */
  hasQuery: boolean;
};

/**
 * Result ordering.
 *
 * "Relevance" is disabled without a search term: there is nothing to rank
 * against, and offering it would produce an order the shopper cannot explain.
 */
function SortDropdown({ value, onChange, hasQuery }: SortDropdownProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-500">
      <span className="hidden sm:inline">Sort</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortKey)}
        aria-label="Sort results"
        className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-gray-900"
      >
        {SORT_OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.value === "relevance" && !hasQuery}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default SortDropdown;

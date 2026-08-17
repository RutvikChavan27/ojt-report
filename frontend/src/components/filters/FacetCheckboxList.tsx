import type { FacetValue } from "../../lib/search";

type FacetCheckboxListProps = {
  options: FacetValue[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  emptyLabel?: string;
};

/**
 * A checkbox list with a count beside every option.
 *
 * The count is a facet count: how many listings that option would produce
 * *given the other filters already applied*. Because each group is counted with
 * its own filter left out, the siblings of a selected option keep real counts
 * and stay switchable — so a zero here means "nothing matches", not "you picked
 * something else".
 */
function FacetCheckboxList({
  options,
  selected,
  onToggle,
  emptyLabel = "Nothing matches the other filters",
}: FacetCheckboxListProps) {
  if (options.length === 0) {
    return <p className="text-xs text-gray-400">{emptyLabel}</p>;
  }

  return (
    <>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center justify-between gap-2 text-sm text-gray-700"
        >
          <span className="flex min-w-0 items-center gap-2">
            <input
              type="checkbox"
              checked={selected.has(option.value)}
              onChange={() => onToggle(option.value)}
              className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="truncate">{option.label}</span>
          </span>
          <span className="flex-shrink-0 text-gray-400">
            ({option.count.toLocaleString("en-IN")})
          </span>
        </label>
      ))}
    </>
  );
}

export default FacetCheckboxList;

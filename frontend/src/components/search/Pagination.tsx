import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type PaginationProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

/**
 * Page controls.
 *
 * Shows a window around the current page rather than every page number: at a
 * hundred thousand listings there are thousands of pages, and rendering them all
 * would be a wall of numbers nobody can use.
 */
function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  const window = 2;
  const from = Math.max(1, page - window);
  const to = Math.min(pageCount, page + window);
  const pages = Array.from({ length: to - from + 1 }, (_, index) => from + index);

  const button =
    "flex h-9 min-w-9 items-center justify-center rounded-full border border-taupe px-3 text-sm font-semibold text-charcoal-700 transition hover:border-charcoal-300 hover:text-charcoal-900 disabled:opacity-40 disabled:hover:border-taupe disabled:hover:text-charcoal-700";

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={button}
      >
        <FiChevronLeft size={16} />
      </button>

      {from > 1 && (
        <>
          <button type="button" onClick={() => onChange(1)} className={button}>
            1
          </button>
          {from > 2 && <span className="px-1 text-charcoal-400">…</span>}
        </>
      )}

      {pages.map((entry) => (
        <button
          key={entry}
          type="button"
          onClick={() => onChange(entry)}
          aria-current={entry === page ? "page" : undefined}
          className={
            entry === page
              ? "flex h-9 min-w-9 items-center justify-center rounded-full bg-mint-500 px-3 text-sm font-bold text-charcoal-900 shadow-sm shadow-mint-500/30"
              : button
          }
        >
          {entry}
        </button>
      ))}

      {to < pageCount && (
        <>
          {to < pageCount - 1 && <span className="px-1 text-charcoal-400">…</span>}
          <button
            type="button"
            onClick={() => onChange(pageCount)}
            className={button}
          >
            {pageCount}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
        className={button}
      >
        <FiChevronRight size={16} />
      </button>
    </nav>
  );
}

export default Pagination;

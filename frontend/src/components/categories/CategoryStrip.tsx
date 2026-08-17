import { Link, useSearchParams } from "react-router-dom";
import { CATEGORIES } from "../../data/marketplace";

/**
 * A single scrolling row of category links, sitting under the search box.
 *
 * The full grid on the homepage is for deciding where to start; this is for
 * switching category without losing your place, which is why it appears above
 * search results rather than on the homepage. Highlights the current category so
 * it doubles as an indicator of where you are.
 */
function CategoryStrip() {
  const [search] = useSearchParams();
  const active = search.get("category");

  return (
    <nav aria-label="Categories" className="border-b border-gray-200">
      {/* Horizontal scroll rather than wrapping: thirteen categories on two or
          three wrapped lines pushes the results themselves off the screen. */}
      <ul className="flex gap-1 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li className="flex-shrink-0">
          <Link
            to="/search"
            className={`block rounded-full px-3.5 py-1.5 text-sm transition ${
              active === null
                ? "bg-gray-900 font-bold text-white"
                : "text-gray-600 hover:bg-black/5 hover:text-gray-900"
            }`}
          >
            All
          </Link>
        </li>

        {CATEGORIES.map((category) => (
          <li key={category.slug} className="flex-shrink-0">
            <Link
              to={`/search?category=${category.slug}`}
              className={`block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition ${
                active === category.slug
                  ? "bg-gray-900 font-bold text-white"
                  : "text-gray-600 hover:bg-black/5 hover:text-gray-900"
              }`}
            >
              {category.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default CategoryStrip;

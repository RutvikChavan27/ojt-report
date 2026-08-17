import { Link } from "react-router-dom";
import {
  LuBike,
  LuBookOpen,
  LuCamera,
  LuCar,
  LuCookingPot,
  LuDumbbell,
  LuGamepad2,
  LuGuitar,
  LuLaptop,
  LuPawPrint,
  LuShirt,
  LuShoppingBag,
  LuSmartphone,
  LuSofa,
  LuTv,
  LuWatch,
} from "react-icons/lu";
import Container from "../layout/Container";
import type { ApiCategory } from "../../lib/api";

type CategoryTilesProps = {
  /**
   * Categories with their live counts, from the API. Passed in rather than
   * fetched here so the homepage makes one request for the whole page instead
   * of this component issuing a second one.
   */
  categories: ApiCategory[];
};

/**
 * One icon per slug, drawn from Lucide rather than Feather.
 *
 * Feather has no sofa, guitar, paw or dress, so several categories were
 * borrowing something vaguely adjacent — furniture used a house, bikes reused
 * the same lightning bolt as electronics. Lucide has a real glyph for each of
 * these, which is the difference between a label you read and one you
 * recognise at a glance.
 *
 * Every key here must exist in `listing_categories`; a slug with no entry falls
 * back to a neutral chip rather than rendering nothing.
 */
const ICONS: Record<string, React.ReactNode> = {
  mobiles: <LuSmartphone size={26} />,
  electronics: <LuTv size={26} />,
  computers: <LuLaptop size={26} />,
  cars: <LuCar size={26} />,
  bikes: <LuBike size={26} />,
  furniture: <LuSofa size={26} />,
  "home-kitchen": <LuCookingPot size={26} />,
  "mens-fashion": <LuShirt size={26} />,
  "womens-fashion": <LuShoppingBag size={26} />,
  "books-stationery": <LuBookOpen size={26} />,
  sports: <LuDumbbell size={26} />,
  toys: <LuGamepad2 size={26} />,
  music: <LuGuitar size={26} />,
  cameras: <LuCamera size={26} />,
  pets: <LuPawPrint size={26} />,
  accessories: <LuWatch size={26} />,
};


/**
 * One gradient per category, used on the icon chip only.
 *
 * The rest of the site stays monochrome — this is the single place colour is
 * allowed, because sixteen identical grey squares are genuinely harder to scan
 * than sixteen distinct ones. Colour here is doing a job (telling tiles apart
 * at a glance), not decorating.
 *
 * A two-stop gradient rather than a flat fill: at this size a flat chip reads
 * as a sticker, and the slight depth is what stops a grid of sixteen looking
 * like a settings screen.
 */
const ICON_COLOURS: Record<string, string> = {
  mobiles: "bg-gradient-to-br from-blue-400 to-blue-600",
  electronics: "bg-gradient-to-br from-cyan-400 to-cyan-600",
  computers: "bg-gradient-to-br from-violet-400 to-violet-600",
  cars: "bg-gradient-to-br from-sky-400 to-sky-600",
  bikes: "bg-gradient-to-br from-amber-400 to-amber-600",
  furniture: "bg-gradient-to-br from-orange-400 to-orange-600",
  "home-kitchen": "bg-gradient-to-br from-teal-400 to-teal-600",
  "mens-fashion": "bg-gradient-to-br from-indigo-400 to-indigo-600",
  "womens-fashion": "bg-gradient-to-br from-pink-400 to-pink-600",
  "books-stationery": "bg-gradient-to-br from-emerald-400 to-emerald-600",
  sports: "bg-gradient-to-br from-lime-500 to-green-600",
  toys: "bg-gradient-to-br from-yellow-400 to-amber-500",
  music: "bg-gradient-to-br from-purple-400 to-purple-600",
  cameras: "bg-gradient-to-br from-fuchsia-400 to-fuchsia-600",
  pets: "bg-gradient-to-br from-rose-400 to-rose-600",
  accessories: "bg-gradient-to-br from-slate-400 to-slate-600",
};

/**
 * The category row that sits across the bottom edge of the hero.
 *
 * Counts are derived from the active listings rather than written into the data,
 * so a tile can never advertise more than a search would actually return.
 *
 * Sits directly under the hero, so anyone who does not yet know what to type has
 * a browsing route without scrolling. White cards on the off-white page rather
 * than overlapping the hero — white on white needed a shadow to read at all.
 */
/**
 * Sixteen tiles, laid out 2/3/4/5 across the breakpoints so the last row is
 * never left with a single orphan. The "other" filter is a leftover guard from
 * when a catch-all category existed; it costs nothing and keeps the grid tidy
 * if one is ever reintroduced.
 */
function CategoryTiles({ categories }: CategoryTilesProps) {
  const tiles = categories.filter((entry) => entry.slug !== "other");

  return (
    <Container className="pt-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tiles.map((category, index) => (
          <Link
            key={category.slug}
            to={`/search?category=${category.slug}`}
            /* Stagger kept short on purpose: at 35ms a step the last of
               thirteen tiles did not begin until 840ms, which is a long time
               for content to sit mid-fade. 18ms tops out under 550ms. */
            style={{ animationDelay: `${320 + index * 18}ms` }}
            className="group relative flex animate-[rise-in_0.5s_ease-out_both] flex-col items-center gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white px-3 py-7 text-center transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-gray-900 hover:shadow-xl motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {/* A wash of the tile's own colour, revealed on hover. Sits behind
                the content and is inert, so it tints without touching layout. */}
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10 ${
                ICON_COLOURS[category.slug] ?? "bg-gray-500"
              }`}
            />

            <span
              className={`relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:rotate-6 motion-reduce:transform-none ${
                ICON_COLOURS[category.slug] ?? "bg-gradient-to-br from-gray-400 to-gray-600"
              }`}
            >
              {ICONS[category.slug]}
              {/* Light sweep across the chip, the same treatment the header
                  logo carries. Only on hover, so the grid is still at rest. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 rounded-2xl bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full motion-reduce:hidden"
              />
            </span>

            <span className="relative min-w-0">
              <span className="block text-sm font-bold leading-tight text-gray-900">
                {category.label}
              </span>
              <span className="mt-1 block text-xs text-gray-400 transition-colors duration-300 group-hover:text-gray-600">
                {category.total.toLocaleString("en-IN")} ads
              </span>
            </span>
          </Link>
        ))}
      </div>
    </Container>
  );
}

export default CategoryTiles;

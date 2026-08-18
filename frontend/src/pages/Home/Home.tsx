import { Link } from "react-router-dom";
import Container from "../../components/layout/Container";
import { FiArrowRight, FiShield, FiTag, FiUsers } from "react-icons/fi";
import CategoryTiles from "../../components/categories/CategoryTiles";
import HeroSearch from "../../components/home/HeroSearch";
import ListingGrid from "../../components/listings/ListingGrid";
import EmptyState from "../../components/common/EmptyState";
import { fetchDashboard } from "../../lib/api";
import { useApi } from "../../hooks/useApi";
import { usePageGate } from "../../store/RouteGate";

/** Shared wrapper for the homepage's stacked sections. */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="pt-16">
      <Container>{children}</Container>
    </section>
  );
}

/** How many busiest-category links to show under the grid. */
const BUSIEST_COUNT = 6;

/**
 * The homepage.
 *
 * Its whole job is to say "this is a place to find second-hand things near you"
 * and then get out of the way: search, then categories, then proof that there is
 * something on the site. Nothing here tries to sell — a classifieds homepage is
 * a directory, not a shop window.
 */
function Home() {
  /* One request for the whole page: the recent grid, the category tiles and the
     live count all come from /api/dashboard, so there is a single loading state
     rather than three sections settling at different moments. Sorting and
     counting are the server's job now — nothing here filters a local array. */
  const { data, loading, error, reload } = useApi(fetchDashboard, []);

  /* One request means one definition of "first load": that call with nothing back
     yet. Hold the branded loader over the viewport until it lands, so the page
     arrives complete rather than as three empty sections. */
  usePageGate(loading && !data);

  const recent = data?.recent ?? [];
  const categories = data?.categories ?? [];

  /** The categories holding the most listings, for the secondary links. */
  const busiest = [...categories]
    .sort((a, b) => b.total - a.total)
    .slice(0, BUSIEST_COUNT);

  const assurances = [
    {
      icon: <FiTag size={18} />,
      title: "Free to post",
      body: "No listing fees and no commission. Post an ad in a couple of minutes.",
    },
    {
      icon: <FiUsers size={18} />,
      title: "Deal directly",
      body: "Talk to the seller yourself. No middleman deciding the price.",
    },
    {
      icon: <FiShield size={18} />,
      title: "Meet safely",
      body: "Meet in a public place and check the item before any money changes hands.",
    },
  ];

  return (
    <div className="pb-16">
      <HeroSearch activeCount={data?.totalActive ?? 0} recent={recent} />
      <CategoryTiles categories={categories} />

      {/* Recent listings */}
      <Section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900">
              Fresh listings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Just posted by people near you.
            </p>
          </div>

          <Link
            to="/search"
            className="group flex items-center gap-1.5 text-sm font-bold text-gray-900"
          >
            See all
            <FiArrowRight
              size={15}
              className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
            />
          </Link>
        </div>

        <div className="mt-6">
          {error ? (
            <EmptyState
              title="Could not load listings"
              description={error}
            >
              <button
                type="button"
                onClick={reload}
                className="inline-flex rounded-full bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-black"
              >
                Try again
              </button>
            </EmptyState>
          ) : (
            <ListingGrid listings={recent} loading={loading} />
          )}
        </div>
      </Section>

      {/* How it works — three short reassurances, not a sales pitch */}
      <Section>
        <div className="grid gap-4 sm:grid-cols-3">
          {assurances.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 transition duration-200 hover:border-gray-900"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.05] text-gray-900">
                {item.icon}
              </span>
              <h3 className="mt-3 text-sm font-bold text-gray-900">
                {item.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Busiest categories, as plain text links for browsing and for search
          engines — a grid of tiles above, a list of words here. */}
      <Section>
        <h2 className="text-xl font-black tracking-tight text-gray-900">
          Busiest right now
        </h2>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {busiest.map((category) => (
            <Link
              key={category.slug}
              to={`/search?category=${category.slug}`}
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:border-gray-900 motion-reduce:hover:translate-y-0"
            >
              {category.label}
              <span className="ml-1.5 text-gray-400">{category.total}</span>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

export default Home;

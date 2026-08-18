import { Link } from "react-router-dom";
import Container from "../layout/Container";
import { CATEGORIES } from "../../data/marketplace";

/**
 * Site footer. Carries the category links a search engine and a browsing visitor
 * both use, plus the safety note a classifieds site is expected to show.
 */
function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-white pb-20 sm:pb-0">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-black tracking-tight text-gray-900">
              BAZAAR
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
              Buy and sell second-hand things near you. Sell something in
              minutes, or search thousands of listings from people in your city.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-900">
              Popular categories
            </p>
            <ul className="mt-3 space-y-2">
              {CATEGORIES.slice(0, 6).map((category) => (
                <li key={category.slug}>
                  <Link
                    to={`/category/${category.slug}`}
                    className="text-sm text-gray-500 transition hover:text-gray-900"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-900">
              Selling
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  to="/post-ad"
                  className="text-sm text-gray-500 transition hover:text-gray-900"
                >
                  Sell something
                </Link>
              </li>
              <li>
                <Link
                  to="/my-listings"
                  className="text-sm text-gray-500 transition hover:text-gray-900"
                >
                  My listings
                </Link>
              </li>
              <li>
                <Link
                  to="/saved-searches"
                  className="text-sm text-gray-500 transition hover:text-gray-900"
                >
                  Saved searches
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-900">
              Staying safe
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-500">
              <li>Meet in a public place.</li>
              <li>Check the item before you pay.</li>
              <li>Never pay a deposit in advance.</li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-gray-200 pt-6 text-xs text-gray-400">
          Bazaar — a student project. Listings and sellers shown are fictional.
        </p>
      </Container>
    </footer>
  );
}

export default Footer;

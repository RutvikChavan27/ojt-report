import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  FiBookmark,
  FiChevronDown,
  FiGrid,
  FiHeart,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiUser,
  FiX,
} from "react-icons/fi";
import Container from "../layout/Container";
import Logo from "../common/Logo";
import SearchBar from "../search/SearchBar";
import { CATEGORIES } from "../../data/marketplace";
import { useAuth } from "../../store/AuthContext";
import { useSavedListings } from "../../store/SavedListingsContext";
import { useSavedSearches } from "../../store/SavedSearchesContext";

/**
 * A few popular categories shown as quick links across the header, filling the
 * space the search box leaves on the pages that carry their own (the home page).
 * Short labels only — this is a shortcut strip, not the full taxonomy, which
 * lives behind the "Categories" button and in the mobile menu.
 */
const QUICK_CATEGORIES: { slug: string; label: string }[] = [
  { slug: "mobiles", label: "Mobiles" },
  { slug: "cars", label: "Cars" },
  { slug: "bikes", label: "Bikes" },
  { slug: "furniture", label: "Furniture" },
  { slug: "electronics", label: "Electronics" },
  { slug: "sports", label: "Sports" },
];

/**
 * The marketplace header: brand, search, categories, and the actions a
 * classifieds site needs — save, saved searches, and posting an ad.
 *
 * "Post an Ad" is the only filled button, because it is the one action the
 * marketplace depends on and everything else is navigation.
 */
function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  /* The pages that carry their own big search box in the body — the welcome
     screen ("/") and the marketplace home ("/home", which has the hero — do not
     repeat one in the header, or two search boxes sit on screen at once. Every
     other page (results, a listing, a category) has no other search, so the
     header carries it there. */
  const showSearch = pathname !== "/" && pathname !== "/home";
  const { count: savedCount } = useSavedListings();
  const { searches } = useSavedSearches();

  /* Seed the box from the URL, so the header shows the search that produced the
     page you are looking at. Without this, opening or reloading /search?q=car
     left the box blank while the results below were plainly filtered by "car" —
     and there was nothing for the clear button to act on. */
  const [searchParams] = useSearchParams();
  const activeQuery = searchParams.get("q") ?? "";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  /** Close either dropdown on an outside click, as a menu is expected to. */
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!categoriesRef.current?.contains(target)) setCategoriesOpen(false);
      if (!profileRef.current?.contains(target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const closeAll = () => {
    setMobileOpen(false);
    setCategoriesOpen(false);
    setProfileOpen(false);
  };

  const iconLink =
    "relative flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition-all duration-150 hover:bg-black/[0.06] hover:text-gray-900 hover:scale-105 active:scale-95 motion-reduce:transform-none";

  const badge = (count: number) =>
    count > 0 ? (
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  const menuPanel =
    "absolute right-0 top-full mt-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl animate-[dropdown-in_160ms_ease-out] motion-reduce:animate-none";
  const menuItem =
    "block rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-black/[0.03] hover:text-gray-900";

  return (
    /* Translucent rather than solid: the page has a subtle noise texture, and a
       flat white bar would cut a hard line across it while scrolling. A hair of
       shadow under the border gives the bar a little lift off the page, and the
       whole thing settles in on load rather than snapping. */
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-[#f2f1ee]/85 shadow-[0_1px_12px_rgba(0,0,0,0.04)] backdrop-blur-md animate-[header-in_400ms_ease-out_both] motion-reduce:animate-none">
      <Container>
        <div className="flex h-18 items-center gap-3 sm:gap-5 lg:gap-7">
          <Logo />

          {showSearch && (
            /* Capped rather than flex-1: stretched across a wide header the box
               was far longer than any query anyone types. */
            <div className="hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg">
              <SearchBar initialQuery={activeQuery} />
            </div>
          )}

          <div ref={categoriesRef} className="relative hidden lg:block">
            {/* A bordered pill with a small dark icon-badge echoing the logo, so
                it reads as a deliberate control rather than plain text. It lifts
                on hover and fills solid when its menu is open. */}
            <button
              type="button"
              onClick={() => setCategoriesOpen((open) => !open)}
              aria-expanded={categoriesOpen}
              className={`group flex items-center gap-2.5 rounded-full border py-2 pl-2 pr-4 text-[15px] font-semibold transition-all duration-200 ease-out motion-reduce:transform-none ${
                categoriesOpen
                  ? "border-gray-900 bg-gray-900 text-white shadow-md"
                  : "border-gray-300 text-gray-700 hover:-translate-y-px hover:border-gray-400 hover:bg-black/[0.06] hover:shadow-sm"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-200 ${
                  categoriesOpen
                    ? "bg-white/15 text-white"
                    : "bg-gray-900 text-white"
                }`}
              >
                <FiGrid size={14} />
              </span>
              Categories
              <FiChevronDown
                size={16}
                className={`transition-transform duration-200 ${categoriesOpen ? "rotate-180" : ""}`}
              />
            </button>

            {categoriesOpen && (
              <div className={`${menuPanel} grid w-64 gap-0.5`}>
                {CATEGORIES.map((category) => (
                  <Link
                    key={category.slug}
                    to={`/category/${category.slug}`}
                    onClick={closeAll}
                    className={menuItem}
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick category links fill the centre on pages without a header
              search box (the home page). They sit behind the same lg breakpoint
              as the Categories button, and give the header a useful, browseable
              middle instead of an empty gap. */}
          {!showSearch && (
            <nav
              aria-label="Popular categories"
              className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex"
            >
              {QUICK_CATEGORIES.map((category) => (
                <NavLink
                  key={category.slug}
                  to={`/category/${category.slug}`}
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-black/[0.06] hover:text-gray-900"
                >
                  {category.label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {/* Icon shortcuts from tablet up; on a phone they live in the menu,
                so the top bar stays uncrowded. */}
            <NavLink
              to="/saved-searches"
              className={`${iconLink} hidden sm:flex`}
              aria-label="Saved searches"
            >
              <FiBookmark size={18} />
              {badge(searches.length)}
            </NavLink>

            <NavLink
              to="/saved"
              className={`${iconLink} hidden sm:flex`}
              aria-label="Saved listings"
            >
              <FiHeart size={18} />
              {badge(savedCount)}
            </NavLink>

            <span aria-hidden className="mx-1 hidden h-6 w-px bg-gray-300 sm:block" />

            {user ? (
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-expanded={profileOpen}
                  className={`flex items-center gap-2 rounded-full py-1.5 pl-2 pr-4 text-sm font-semibold transition-all duration-150 hover:bg-black/[0.06] ${
                    profileOpen ? "bg-black/[0.06] text-gray-900" : "text-gray-700"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                  <FiChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {profileOpen && (
                  <div className={`${menuPanel} w-52`}>
                    <div className="px-3 py-2">
                      <p className="truncate text-xs text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    <Link to="/profile" onClick={closeAll} className={menuItem}>
                      My profile
                    </Link>
                    <Link to="/my-listings" onClick={closeAll} className={menuItem}>
                      My listings
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        closeAll();
                        await signOut();
                        navigate("/home");
                      }}
                      className={`${menuItem} flex w-full items-center gap-2 text-left`}
                    >
                      <FiLogOut size={14} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Account entry point as a user icon rather than the word
              // "Login" — labelled for assistive tech and with a tooltip.
              <Link
                to="/login"
                aria-label="Login"
                title="Login"
                className={`${iconLink} max-sm:hidden`}
              >
                <FiUser size={19} />
              </Link>
            )}

            {/* Shown to everyone. Posting needs an account, but the gate lives
                on the page itself (RequireAuth), so a signed-out visitor lands
                on a log-in prompt that returns them here afterwards rather than
                on a button that was hidden from them. */}
            <Link
              to="/post-ad"
              className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-150 ease-out hover:bg-black hover:shadow-md hover:-translate-y-px active:translate-y-0 active:scale-95 motion-reduce:transform-none sm:px-6 sm:py-3"
            >
              <FiPlus size={17} />
              <span className="hidden sm:inline">Post an Ad</span>
              <span className="sm:hidden">Sell</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
              className={`${iconLink} lg:hidden`}
            >
              {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>

        {/* On narrow screens the box gets its own row rather than shrinking into
            uselessness beside the logo. Same homepage exception. */}
        {showSearch && (
          <div className="pb-3 md:hidden">
            <SearchBar initialQuery={activeQuery} />
          </div>
        )}
      </Container>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-[#f2f1ee] lg:hidden">
          <Container className="grid gap-1 py-3">
            {!user && (
              <Link
                to="/login"
                onClick={closeAll}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-black/[0.03]"
              >
                <FiUser size={15} />
                Login / Sign Up
              </Link>
            )}
            <Link to="/my-listings" onClick={closeAll} className={menuItem}>
              My listings
            </Link>
            <Link to="/saved" onClick={closeAll} className={menuItem}>
              Saved listings
            </Link>
            <Link to="/saved-searches" onClick={closeAll} className={menuItem}>
              Saved searches
            </Link>

            <p className="mt-2 px-3 text-xs font-bold uppercase tracking-wide text-gray-400">
              Categories
            </p>
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                to={`/category/${category.slug}`}
                onClick={closeAll}
                className={menuItem}
              >
                {category.label}
              </Link>
            ))}
          </Container>
        </div>
      )}
    </header>
  );
}

export default Navbar;

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

  /* The homepage hero already carries a large search box. Repeating it in the
     header put two identical boxes on screen at once, so the header one only
     appears on the pages that have no other way to search. */
  const showSearch = pathname !== "/";
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
    "relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-black/5 hover:text-gray-900";

  const badge = (count: number) =>
    count > 0 ? (
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  const menuPanel =
    "absolute right-0 top-full mt-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl";
  const menuItem =
    "block rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-black/[0.03] hover:text-gray-900";

  return (
    /* Translucent rather than solid: the page has a subtle noise texture, and a
       flat white bar would cut a hard line across it while scrolling. */
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-[#f2f1ee]/90 backdrop-blur">
      <Container>
        <div className="flex h-18 items-center gap-5 lg:gap-7">
          <Logo />

          {showSearch && (
            /* Capped rather than flex-1: stretched across a wide header the box
               was far longer than any query anyone types. */
            <div className="hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg">
              <SearchBar initialQuery={activeQuery} />
            </div>
          )}

          <div ref={categoriesRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setCategoriesOpen((open) => !open)}
              aria-expanded={categoriesOpen}
              /* Sized to sit level with the search box and the Post an Ad
                 button either side of it — at px-3/py-1.5 it read as a smaller
                 class of control than its neighbours. */
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-black/5"
            >
              <FiGrid size={17} />
              Categories
              <FiChevronDown size={15} />
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

          <div className="ml-auto flex items-center gap-1.5">
            <NavLink
              to="/saved-searches"
              className={iconLink}
              aria-label="Saved searches"
            >
              <FiBookmark size={18} />
              {badge(searches.length)}
            </NavLink>

            <NavLink to="/saved" className={iconLink} aria-label="Saved listings">
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
                  className="flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-gray-700 transition hover:bg-black/5"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                  <FiChevronDown size={14} />
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
              <Link
                to="/login"
                className="hidden rounded-full px-3 py-1.5 text-[13px] font-semibold text-gray-700 transition hover:bg-black/5 sm:block"
              >
                Login
              </Link>
            )}

            {/* Shown to everyone. Posting needs an account, but the gate lives
                on the page itself (RequireAuth), so a signed-out visitor lands
                on a log-in prompt that returns them here afterwards rather than
                on a button that was hidden from them. */}
            <Link
              to="/post-ad"
              className="flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-2 text-[13px] font-bold text-white transition hover:bg-black sm:px-4"
            >
              <FiPlus size={16} />
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

import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
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
import LocationSelector from "../search/LocationSelector";
import { CATEGORIES } from "../../data/marketplace";
import { useAuth } from "../../store/AuthContext";
import { useSavedListings } from "../../store/SavedListingsContext";
import { useSavedSearches } from "../../store/SavedSearchesContext";

/**
 * The marketplace header: brand, search, categories, and the actions a
 * classifieds site needs — save, saved searches, and posting an ad.
 *
 * "Sell Something" is the only filled button, because it is the one action the
 * marketplace depends on and everything else is navigation.
 */
function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { count: savedCount } = useSavedListings();
  const { searches } = useSavedSearches();

  /* The one search experience for the whole marketplace: it lives in the
     header on every page, including the home page, rather than the home page
     also carrying its own copy in the hero. Location travels with it, since a
     search and the place it is scoped to are one decision, not two. */
  const [city, setCity] = useState<string | null>(null);

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
    "relative flex h-11 w-11 items-center justify-center rounded-full text-charcoal-600 transition-all duration-150 hover:bg-sand hover:text-charcoal-900 hover:scale-105 active:scale-95 motion-reduce:transform-none";

  const badge = (count: number) =>
    count > 0 ? (
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-mint-500 px-1 text-[10px] font-bold text-charcoal-900">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  const menuPanel =
    "absolute right-0 top-full mt-2 rounded-2xl border border-taupe bg-gradient-to-br from-cyan-50 to-mint-50 p-2 shadow-xl shadow-charcoal-900/5 animate-[dropdown-in_160ms_ease-out] motion-reduce:animate-none";
  const menuItem =
    "block rounded-xl px-3 py-2 text-sm text-charcoal-700 transition hover:bg-sand hover:text-charcoal-900";

  return (
    /* Transparent rather than a solid bar: no border and no shadow, so it reads
       as part of the same gradient surface as the hero beneath it rather than a
       block sitting on top of it. Blur plus a light tint is what keeps nav text
       readable once the page is scrolled and real content is passing underneath
       — a fully see-through bar would let card text collide with nav text. */
    <header className="sticky top-0 z-50 bg-gradient-to-r from-cyan-50/50 to-mint-50/50 backdrop-blur-md animate-[header-in_400ms_ease-out_both] motion-reduce:animate-none">
      <Container>
        <div className="flex h-18 items-center gap-3 sm:gap-5 lg:gap-7">
          <Logo />

          {/* The search cluster now carries most of the header's width and the
              "large" size of the box itself — once the header blends into the
              hero visually, this is the one thing in that whole band worth
              making the largest. Location only joins it from lg — at md there
              is barely room for the box itself, and a location picker with no
              search room to act on would be worse than not showing it. */}
          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex md:max-w-xl lg:max-w-2xl xl:max-w-3xl">
            <div className="hidden flex-shrink-0 lg:block lg:w-36 xl:w-40">
              <LocationSelector value={city} onChange={setCity} className="w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <SearchBar initialQuery={activeQuery} city={city} size="large" />
            </div>
          </div>

          {/* Everything that is not the search itself lives in one cluster
              pinned to the right edge — categories, saved items, the account
              menu and the primary action — rather than categories floating in
              the middle of the bar on its own. */}
          <div className="ml-auto flex items-center gap-1.5">
            <div ref={categoriesRef} className="relative hidden lg:block">
              {/* Filled mint at rest — the accent pair's "active navigation"
                  half — rather than only turning solid once opened, so it
                  reads as a deliberate control from the first paint. */}
              <button
                type="button"
                onClick={() => setCategoriesOpen((open) => !open)}
                aria-expanded={categoriesOpen}
                className={`group flex items-center gap-2.5 rounded-full border border-mint-500 bg-mint-500 py-2 pl-2 pr-4 text-[15px] font-semibold text-charcoal-900 shadow-md shadow-mint-500/20 transition-all duration-200 ease-out hover:-translate-y-px hover:border-mint-600 hover:bg-mint-600 hover:shadow-lg motion-reduce:transform-none ${
                  categoriesOpen ? "border-mint-600 bg-mint-600" : ""
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-charcoal-900/10 text-charcoal-900">
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

            {/* Icon shortcuts from tablet up; on a phone they live in the menu,
                so the top bar stays uncrowded. */}
            <NavLink
              to="/saved-searches"
              className={`${iconLink} max-sm:hidden`}
              aria-label="Saved searches"
            >
              <FiBookmark size={18} />
              {badge(searches.length)}
            </NavLink>

            <NavLink
              to="/saved"
              className={`${iconLink} max-sm:hidden`}
              aria-label="Saved listings"
            >
              <FiHeart size={18} />
              {badge(savedCount)}
            </NavLink>

            <span aria-hidden className="mx-1 hidden h-6 w-px bg-taupe sm:block" />

            {user ? (
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-expanded={profileOpen}
                  className={`flex items-center gap-2 rounded-full py-1.5 pl-2 pr-4 text-sm font-semibold transition-all duration-150 hover:bg-sand ${
                    profileOpen ? "bg-sand text-charcoal-900" : "text-charcoal-700"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-900 text-sm font-bold text-white">
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
                      <p className="truncate text-xs text-charcoal-400">
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
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00c9ff] to-[#92fe9d] px-4 py-2.5 text-sm font-bold text-charcoal-900 shadow-sm shadow-cyan-500/30 transition-all duration-150 ease-out hover:shadow-md hover:shadow-mint-500/40 hover:brightness-105 hover:-translate-y-px active:translate-y-0 active:scale-95 motion-reduce:transform-none sm:px-6 sm:py-3"
            >
              <FiPlus size={17} />
              <span className="hidden sm:inline">Sell Something</span>
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

        {/* On narrow screens the search cluster gets its own row rather than
            shrinking into uselessness beside the logo, with location above the
            box rather than beside it — side by side, neither had room to say
            what it was. */}
        <div className="flex flex-col gap-2 pb-3 sm:flex-row md:hidden">
          <LocationSelector value={city} onChange={setCity} className="sm:w-40" />
          <div className="min-w-0 flex-1">
            <SearchBar initialQuery={activeQuery} city={city} size="large" />
          </div>
        </div>
      </Container>

      {mobileOpen && (
        <div className="border-t border-taupe bg-gradient-to-br from-cyan-50 to-mint-50 lg:hidden">
          <Container className="grid gap-1 py-3">
            {!user && (
              <Link
                to="/login"
                onClick={closeAll}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-charcoal-900 transition hover:bg-sand"
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

            <p className="mt-2 px-3 text-xs font-bold uppercase tracking-wide text-charcoal-400">
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

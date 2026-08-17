import { useEffect } from "react";
import Container from "./components/layout/Container";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import EmptyState from "./components/common/EmptyState";
import MobilePostBar from "./components/common/MobilePostBar";
import RequireAuth from "./components/common/RequireAuth";
import Welcome from "./pages/Welcome/Welcome";
import Home from "./pages/Home/Home";
import SearchResults from "./pages/Search/SearchResults";
import ListingDetails from "./pages/Listing/ListingDetails";
import CategoryPage from "./pages/Category/CategoryPage";
import PostAd from "./pages/PostAd/PostAd";
import MyListings from "./pages/MyListings/MyListings";
import SavedSearches from "./pages/SavedSearches/SavedSearches";
import SavedListings from "./pages/SavedListings/SavedListings";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Profile from "./pages/Profile/Profile";

/**
 * Returns to the top when the path changes.
 *
 * Keyed on pathname only, deliberately: the search page rewrites its query
 * string on every filter click, and scrolling to the top each time would yank
 * the page away from someone reading halfway down the results.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

/**
 * Routes for Bazaar.
 *
 * Browsing, searching, filtering, sorting and opening a listing need no account.
 * Exactly four things do — posting, saved searches, the seller dashboard and the
 * profile — and each is wrapped in RequireAuth.
 *
 * One account system: there is no buyer/seller split to express here, and no
 * separate seller door. "Seller" describes whoever a listing belongs to, and
 * whether a signed-in person may change a given listing is an ownership
 * question only the server can settle.
 */
function App() {
  const { pathname } = useLocation();

  /* The onboarding is a full screen of its own: the marketplace header and
     footer around it would give away the page it is introducing.

     "/" is the welcome page and "/home" is the marketplace, so opening the site
     always starts at the introduction — no flag, no first-visit special case,
     and a refresh shows the same thing. */
  const onboarding = pathname === "/" || pathname === "/welcome";


  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      {!onboarding && <Navbar />}

      <main className="flex-1">
        <Routes>
          {/* The site opens here. Choosing a role pushes, so Back from the
              marketplace returns to the introduction rather than leaving the
              site. */}
          <Route path="/" element={<Welcome />} />
          {/* Alias, so an old link or bookmark still lands somewhere sensible */}
          {/* Both paths render the landing page. "/welcome" is the named entry
              point; "/" is what a bare domain resolves to, and redirecting one
              to the other would put a pointless hop in front of the first page
              anyone sees. */}
          <Route path="/welcome" element={<Welcome />} />

          {/* The marketplace homepage, reached by choosing USER */}
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          {/* Saved listings live on the device, so no account is needed */}
          <Route path="/saved" element={<SavedListings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* The separate seller doors are gone. Kept as redirects so an old
              link or bookmark lands on the one login rather than a 404. */}
          <Route path="/seller/login" element={<Navigate to="/login" replace />} />
          <Route
            path="/seller/register"
            element={<Navigate to="/register" replace />}
          />

          {/* Needs an account */}
          <Route
            path="/post-ad"
            element={
              <RequireAuth action="post an ad">
                <PostAd />
              </RequireAuth>
            }
          />
          <Route
            path="/my-listings"
            element={
              <RequireAuth action="see your listings">
                <MyListings />
              </RequireAuth>
            }
          />
          <Route
            path="/saved-searches"
            element={
              <RequireAuth action="save searches">
                <SavedSearches />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth action="see your profile">
                <Profile />
              </RequireAuth>
            }
          />

          <Route
            path="*"
            element={
              <Container className="py-16" narrow="md">
                <EmptyState
                  as="h1"
                  title="Page not found"
                  description="That link does not point anywhere on Bazaar."
                />
              </Container>
            }
          />
        </Routes>
      </main>

      {!onboarding && <MobilePostBar />}
      {!onboarding && <Footer />}
    </div>
  );
}

export default App;

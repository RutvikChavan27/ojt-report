import { useEffect, useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Dashboard from "./pages/Dashboard/Dashboard";
import Shop from "./pages/Shop/Shop";
import Wishlist from "./pages/Wishlist/Wishlist";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import CategoryListings from "./pages/CategoryListings/CategoryListings";
import ListingDetail from "./pages/ListingDetail/ListingDetail";
import Cart from "./pages/Cart/Cart";
import type { Listing, ListingCategory, Product } from "./lib/api";

/** Views reachable from the navbar; the detail views are pushed on top of one. */
type MainPage = "home" | "shop" | "wishlist" | "cart";
type Page = MainPage | "product" | "category" | "listing";

function App() {
  const [page, setPage] = useState<Page>("home");
  const [returnPage, setReturnPage] = useState<MainPage>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Men");

  /**
   * Where the bag's Back link returns to. The bag is reachable from the navbar
   * on any page and from "View your bag" on a detail page, so the origin has to
   * be recorded rather than assumed.
   */
  const [bagReturn, setBagReturn] = useState<Page>("home");

  const goTo = (next: MainPage) => setPage(next);

  const openCart = () => {
    // Guard against re-entering the bag and making Back point at itself.
    if (page !== "cart") setBagReturn(page);
    setPage("cart");
  };

  /** Remembers which navbar view to return to when a detail view is opened. */
  const rememberReturnPage = () => {
    if (
      page === "home" ||
      page === "shop" ||
      page === "wishlist" ||
      page === "cart"
    ) {
      setReturnPage(page);
    }
  };

  const onSelectProduct = (product: Product) => {
    rememberReturnPage();
    setSelectedProduct(product);
    setPage("product");
  };

  const onSelectCategory = (category: ListingCategory) => {
    rememberReturnPage();
    setSelectedCategory(category);
    setPage("category");
  };

  const onSelectListing = (listing: Listing) => {
    setSelectedListingId(listing.id);
    setPage("listing");
  };

  // Swapping the view keeps the window's scroll offset, so opening a product
  // from halfway down the home page used to land you near the footer. Reset to
  // the top on every navigation, including detail-to-detail.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [page, selectedProduct?.id, selectedListingId, selectedCategory?.slug]);

  const dashboard = (
    <Dashboard
      searchQuery={searchQuery}
      activeCategory={activeCategory}
      onGoToShopClick={() => goTo("shop")}
      onSelectProduct={onSelectProduct}
      onSelectCategory={onSelectCategory}
    />
  );

  return (
    <div className="min-h-screen">
      <Navbar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onGoHome={() => goTo("home")}
        onOpenWishlist={() => goTo("wishlist")}
        onOpenCart={openCart}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main>
        {page === "home" ? (
          dashboard
        ) : page === "shop" ? (
          <Shop
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onSelectProduct={onSelectProduct}
          />
        ) : page === "wishlist" ? (
          <Wishlist onGoToShopClick={() => goTo("shop")} />
        ) : page === "cart" ? (
          <Cart
            onStartShopping={() => goTo("home")}
            onBack={() => setPage(bagReturn)}
          />
        ) : page === "category" && selectedCategory ? (
          <CategoryListings
            categorySlug={selectedCategory.slug}
            categoryLabel={selectedCategory.label}
            audience={activeCategory}
            onBack={() => goTo(returnPage)}
            onSelectListing={onSelectListing}
          />
        ) : page === "listing" && selectedListingId ? (
          <ListingDetail
            listingId={selectedListingId}
            onBack={() => setPage(selectedCategory ? "category" : returnPage)}
            onViewBag={openCart}
          />
        ) : page === "product" && selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onBack={() => goTo(returnPage)}
            onViewBag={openCart}
          />
        ) : (
          dashboard
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;

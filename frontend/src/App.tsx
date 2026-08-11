import { useEffect, useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Dashboard from "./pages/Dashboard/Dashboard";
import Shop from "./pages/Shop/Shop";
import Wishlist from "./pages/Wishlist/Wishlist";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import CategoryListings from "./pages/CategoryListings/CategoryListings";
import ListingDetail from "./pages/ListingDetail/ListingDetail";
import type { Listing, ListingCategory, Product } from "./lib/api";

/** Views reachable from the navbar; the detail views are pushed on top of one. */
type MainPage = "home" | "shop" | "wishlist";
type Page = MainPage | "product" | "category" | "listing";

function App() {
  const [page, setPage] = useState<Page>("home");
  const [returnPage, setReturnPage] = useState<MainPage>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Men");

  const goTo = (next: MainPage) => setPage(next);

  /** Remembers which navbar view to return to when a detail view is opened. */
  const rememberReturnPage = () => {
    if (page === "home" || page === "shop" || page === "wishlist") {
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
          />
        ) : page === "product" && selectedProduct ? (
          <ProductDetail product={selectedProduct} onBack={() => goTo(returnPage)} />
        ) : (
          dashboard
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;

import { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Dashboard from "./pages/Dashboard/Dashboard";
import Shop from "./pages/Shop/Shop";
import Wishlist from "./pages/Wishlist/Wishlist";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import type { Product } from "./lib/api";

type MainPage = "home" | "shop" | "wishlist";

function App() {
  const [page, setPage] = useState<MainPage | "product">("home");
  const [returnPage, setReturnPage] = useState<MainPage>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Men");

  const goTo = (next: MainPage) => {
    setPage(next);
  };

  const onSelectProduct = (product: Product) => {
    setReturnPage(page === "product" ? returnPage : page);
    setSelectedProduct(product);
    setPage("product");
  };

  return (
    <div className="min-h-screen">
      <Navbar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onGoHome={() => goTo("home")}
        onOpenWishlist={() => goTo("wishlist")}
      />

      <main>
        {page === "home" ? (
          <Dashboard
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategory={activeCategory}
            onGoToShopClick={() => goTo("shop")}
            onSelectProduct={onSelectProduct}
          />
        ) : page === "shop" ? (
          <Shop
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onSelectProduct={onSelectProduct}
          />
        ) : page === "wishlist" ? (
          <Wishlist onGoToShopClick={() => goTo("shop")} />
        ) : selectedProduct ? (
          <ProductDetail product={selectedProduct} onBack={() => goTo(returnPage)} />
        ) : (
          <Dashboard
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategory={activeCategory}
            onGoToShopClick={() => goTo("shop")}
            onSelectProduct={onSelectProduct}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;

import { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Dashboard from "./pages/Dashboard/Dashboard";
import Shop from "./pages/Shop/Shop";
import Wishlist from "./pages/Wishlist/Wishlist";

function App() {
  const [page, setPage] = useState<"home" | "shop" | "wishlist">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Men");

  return (
    <div className="min-h-screen">
      <Navbar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onGoHome={() => setPage("home")}
        onOpenWishlist={() => setPage("wishlist")}
      />

      <main>
        {page === "home" ? (
          <Dashboard
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategory={activeCategory}
            onGoToShopClick={() => setPage("shop")}
          />
        ) : page === "shop" ? (
          <Shop
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        ) : (
          <Wishlist onGoToShopClick={() => setPage("shop")} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;

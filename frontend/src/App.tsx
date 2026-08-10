import { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Dashboard from "./pages/Dashboard/Dashboard";
import Shop from "./pages/Shop/Shop";

function App() {
  const [page, setPage] = useState<"home" | "shop">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Men");

  return (
    <div className="min-h-screen">
      <Navbar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onGoHome={() => setPage("home")}
      />

      <main>
        {page === "home" ? (
          <Dashboard
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategory={activeCategory}
            onGoToShopClick={() => setPage("shop")}
          />
        ) : (
          <Shop
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;

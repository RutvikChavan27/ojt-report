import Hero from "../../components/Hero/Hero";
import TopProducts from "../../components/TopProducts/TopProducts";
import ShopByCategory from "../../components/ShopByCategory/ShopByCategory";
import type { Product } from "../../lib/api";

type DashboardProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategory: string;
  onGoToShopClick: () => void;
  onSelectProduct: (product: Product) => void;
};

function Dashboard({
  searchQuery,
  onSearchChange,
  activeCategory,
  onGoToShopClick,
  onSelectProduct,
}: DashboardProps) {
  return (
    <>
      <Hero
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeCategory={activeCategory}
        onGoToShopClick={onGoToShopClick}
      />
      <TopProducts
        searchQuery={searchQuery}
        activeCategory={activeCategory}
        onSelectProduct={onSelectProduct}
      />
      <ShopByCategory activeCategory={activeCategory} />
    </>
  );
}

export default Dashboard;

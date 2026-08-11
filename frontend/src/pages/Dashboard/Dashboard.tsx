import Hero from "../../components/Hero/Hero";
import TopProducts from "../../components/TopProducts/TopProducts";
import ShopByCategory from "../../components/ShopByCategory/ShopByCategory";
import type { Product } from "../../lib/api";

type DashboardProps = {
  searchQuery: string;
  activeCategory: string;
  onGoToShopClick: () => void;
  onSelectProduct: (product: Product) => void;
};

function Dashboard({
  searchQuery,
  activeCategory,
  onGoToShopClick,
  onSelectProduct,
}: DashboardProps) {
  return (
    <>
      <Hero
        activeCategory={activeCategory}
        onGoToShopClick={onGoToShopClick}
        onSelectProduct={onSelectProduct}
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

import Hero from "../../components/Hero/Hero";
import TopProducts from "../../components/TopProducts/TopProducts";
import ShopByCategory from "../../components/ShopByCategory/ShopByCategory";
import type { ListingCategory, Product } from "../../lib/api";

type DashboardProps = {
  searchQuery: string;
  activeCategory: string;
  onGoToShopClick: () => void;
  onSelectProduct: (product: Product) => void;
  onSelectCategory?: (category: ListingCategory) => void;
};

function Dashboard({
  searchQuery,
  activeCategory,
  onGoToShopClick,
  onSelectProduct,
  onSelectCategory,
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
      <ShopByCategory
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
      />
    </>
  );
}

export default Dashboard;

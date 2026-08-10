import Hero from "../../components/Hero/Hero";
import TopProducts from "../../components/TopProducts/TopProducts";
import ShopByCategory from "../../components/ShopByCategory/ShopByCategory";

type DashboardProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategory: string;
  onGoToShopClick: () => void;
};

function Dashboard({
  searchQuery,
  onSearchChange,
  activeCategory,
  onGoToShopClick,
}: DashboardProps) {
  return (
    <>
      <Hero
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeCategory={activeCategory}
        onGoToShopClick={onGoToShopClick}
      />
      <TopProducts searchQuery={searchQuery} activeCategory={activeCategory} />
      <ShopByCategory activeCategory={activeCategory} />
    </>
  );
}

export default Dashboard;

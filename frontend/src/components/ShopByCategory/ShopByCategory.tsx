import { fetchListingCategories, type ListingCategory } from "../../lib/api";
import { useApi } from "../../hooks/useApi";

type ShopByCategoryProps = {
  activeCategory: string;
  onSelectCategory?: (category: ListingCategory) => void;
};

function ShopByCategory({ activeCategory, onSelectCategory }: ShopByCategoryProps) {
  // Marketplace categories rather than the storefront's, because these are what
  // the tiles now open: a real, countable set of listings.
  const { data, loading, error } = useApi(
    () => fetchListingCategories(activeCategory),
    [activeCategory],
  );
  const categories = data ?? [];

  return (
    <section id="collections" className="pb-16">
      <div className="mx-auto w-full px-6 sm:px-10 lg:px-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-black leading-none tracking-tight text-gray-900 sm:text-4xl">
            SHOP BY CATEGORY
          </h2>

          <a
            href="#new"
            className="pb-1 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            See All
          </a>
        </div>

        {error ? (
          <p className="mt-10 text-sm text-gray-500">
            Couldn’t load categories. {error}
          </p>
        ) : loading ? (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[4/5] animate-pulse bg-gray-200"
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-5">
            {categories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => onSelectCategory?.(category)}
                aria-label={`Browse ${category.label}`}
                className="group relative aspect-[4/5] overflow-hidden text-left"
              >
                <img
                  src={category.image}
                  alt={category.label}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 text-lg font-bold text-white">
                  {category.label}
                </span>
                <span className="absolute bottom-4 right-4 text-xs font-semibold text-white/80">
                  {category.total.toLocaleString("en-IN")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ShopByCategory;

import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ProductCard from "../Products/ProductCard";
import { MEN_PRODUCTS, WOMEN_PRODUCTS } from "../../data/products";

const PAGE_SIZE = 4;

type TopProductsProps = {
  searchQuery: string;
  activeCategory: string;
};

// Strips spaces/hyphens so "tshirt" still matches "T-Shirt" or "T Shirt".
const normalize = (value: string) => value.toLowerCase().replace(/[\s-]+/g, "");

function TopProducts({ searchQuery, activeCategory }: TopProductsProps) {
  const [page, setPage] = useState(0);

  const allProducts = activeCategory === "Women" ? WOMEN_PRODUCTS : MEN_PRODUCTS;
  const pageCount = Math.ceil(allProducts.length / PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [activeCategory]);

  const query = searchQuery.trim();
  const isSearching = query.length > 0;
  const normalizedQuery = normalize(query);

  const products = isSearching
    ? allProducts.filter(
        (product) =>
          normalize(product.name).includes(normalizedQuery) ||
          normalize(product.category).includes(normalizedQuery) ||
          product.price.toString().includes(query)
      )
    : allProducts.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const goToPrevious = () =>
    setPage((current) => (current - 1 + pageCount) % pageCount);
  const goToNext = () => setPage((current) => (current + 1) % pageCount);

  return (
    <section id="new" className="pb-16">
      <div className="mx-auto w-full px-6 sm:px-10 lg:px-16">
        <div className="relative text-center">
          <a
            href="#collections"
            className="absolute right-0 top-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            See All
          </a>

          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            TRENDING PICKS
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-sm text-gray-500">
            No products match “{searchQuery}”.
          </p>
        )}

        <div className="mt-10 flex justify-center gap-3">
          <button
            type="button"
            aria-label="Previous page"
            disabled={isSearching}
            onClick={goToPrevious}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronLeft size={16} />
          </button>

          <button
            type="button"
            aria-label="Next page"
            disabled={isSearching}
            onClick={goToNext}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default TopProducts;

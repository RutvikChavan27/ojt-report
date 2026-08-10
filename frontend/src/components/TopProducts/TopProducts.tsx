import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ProductCard from "../Products/ProductCard";
import { fetchProducts, fetchSearchResults, type Product } from "../../lib/api";
import { useApi } from "../../hooks/useApi";

const PAGE_SIZE = 4;
const SEARCH_DEBOUNCE_MS = 300;

type TopProductsProps = {
  searchQuery: string;
  activeCategory: string;
  onSelectProduct?: (product: Product) => void;
};

function TopProducts({ searchQuery, activeCategory, onSelectProduct }: TopProductsProps) {
  const [page, setPage] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery.trim());

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedQuery(searchQuery.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const isSearching = debouncedQuery.length > 0;

  const {
    data: browseData,
    loading: browseLoading,
    error: browseError,
  } = useApi(() => fetchProducts(activeCategory), [activeCategory]);

  const {
    data: searchData,
    loading: searchLoading,
    error: searchError,
  } = useApi(
    () =>
      isSearching
        ? fetchSearchResults(debouncedQuery, activeCategory)
        : Promise.resolve([]),
    [isSearching, debouncedQuery, activeCategory],
  );

  const allProducts = browseData ?? [];
  const pageCount = Math.max(1, Math.ceil(allProducts.length / PAGE_SIZE));

  useEffect(() => {
    setPage(0);
  }, [activeCategory]);

  const products = isSearching
    ? (searchData ?? [])
    : allProducts.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const loading = isSearching ? searchLoading : browseLoading;
  const error = isSearching ? searchError : browseError;

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

        {error ? (
          <p className="mt-10 text-sm text-gray-500">
            Couldn’t load products. {error}
          </p>
        ) : loading ? (
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <div key={index}>
                <div className="aspect-[3/4] animate-pulse rounded-2xl bg-gray-200" />
                <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
              />
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
            disabled={isSearching || loading || !!error}
            onClick={goToPrevious}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronLeft size={16} />
          </button>

          <button
            type="button"
            aria-label="Next page"
            disabled={isSearching || loading || !!error}
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

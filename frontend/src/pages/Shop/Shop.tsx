import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FiChevronDown, FiChevronUp, FiArrowUp } from "react-icons/fi";
import ShopProductCard from "../../components/Products/ShopProductCard";
import { fetchProducts, type Product } from "../../lib/api";
import { useApi } from "../../hooks/useApi";

const SIZES = [
  { label: "XS", count: 102 },
  { label: "S", count: 179 },
  { label: "M", count: 178 },
  { label: "L", count: 152 },
  { label: "XL", count: 143 },
];

// Counts how many products share each value of the given field, e.g. how
// many products per brand — drives the "(n)" counts next to each checkbox.
function countByField(products: Product[], field: "category" | "brand" | "color") {
  const counts = new Map<string, number>();
  products.forEach((product) => {
    const value = product[field];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return counts;
}

type FilterSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function FilterSection({ title, defaultOpen = true, children }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-5 first:pt-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between text-sm font-bold text-gray-900"
      >
        {title}
        {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>

      {isOpen && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
}

type CheckboxFilterListProps = {
  counts: Map<string, number>;
  selected: Set<string>;
  onToggle: (value: string) => void;
};

function CheckboxFilterList({ counts, selected, onToggle }: CheckboxFilterListProps) {
  return (
    <>
      {[...counts.entries()].map(([value, count]) => (
        <label
          key={value}
          className="flex items-center justify-between gap-2 text-sm text-gray-700"
        >
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.has(value)}
              onChange={() => onToggle(value)}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            {value}
          </span>
          <span className="text-gray-400">({count})</span>
        </label>
      ))}
    </>
  );
}

// Adds/removes a value from a Set, returning a new Set so React sees the change.
function toggleInSet(set: Set<string>, value: string) {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

type ShopProps = {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
};

function Shop({ activeCategory, onCategoryChange }: ShopProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Fetches every product once (both genders) so the "Men (n)"/"Women (n)"
  // counts stay accurate regardless of which gender is currently selected.
  const { data, loading, error } = useApi(() => fetchProducts(""), []);
  const everyProduct = data ?? [];
  const menProducts = useMemo(
    () => everyProduct.filter((product) => product.gender === "Men"),
    [everyProduct],
  );
  const womenProducts = useMemo(
    () => everyProduct.filter((product) => product.gender === "Women"),
    [everyProduct],
  );

  useEffect(() => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setSelectedColors(new Set());
  }, [activeCategory]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const allProducts = activeCategory === "Women" ? womenProducts : menProducts;

  const categoryCounts = useMemo(() => countByField(allProducts, "category"), [allProducts]);
  const brandCounts = useMemo(() => countByField(allProducts, "brand"), [allProducts]);
  const colorCounts = useMemo(() => countByField(allProducts, "color"), [allProducts]);

  const products = allProducts.filter(
    (product) =>
      (selectedCategories.size === 0 || selectedCategories.has(product.category)) &&
      (selectedBrands.size === 0 || selectedBrands.has(product.brand)) &&
      (selectedColors.size === 0 || selectedColors.has(product.color))
  );

  const activeFilterCount =
    1 + selectedCategories.size + selectedBrands.size + selectedColors.size;

  const clearAll = () => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setSelectedColors(new Set());
  };

  return (
    <section className="pb-20 pt-8">
      <div className="mx-auto w-full px-6 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          {/* Filters sidebar */}
          <aside>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Filters({activeFilterCount})
              </h2>
              <button
                type="button"
                onClick={clearAll}
                className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
              >
                Clear All
              </button>
            </div>

            <div className="mt-4">
              <FilterSection title="Gender">
                <label className="flex items-center justify-between gap-2 text-sm text-gray-700">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={activeCategory === "Men"}
                      onChange={() => onCategoryChange("Men")}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    Men
                  </span>
                  <span className="text-gray-400">({menProducts.length})</span>
                </label>

                <label className="flex items-center justify-between gap-2 text-sm text-gray-700">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={activeCategory === "Women"}
                      onChange={() => onCategoryChange("Women")}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    Women
                  </span>
                  <span className="text-gray-400">({womenProducts.length})</span>
                </label>
              </FilterSection>

              <FilterSection title="Category">
                <CheckboxFilterList
                  counts={categoryCounts}
                  selected={selectedCategories}
                  onToggle={(value) =>
                    setSelectedCategories((current) => toggleInSet(current, value))
                  }
                />
              </FilterSection>

              <FilterSection title="Sizes">
                {SIZES.map((size) => (
                  <label
                    key={size.label}
                    className="flex items-center justify-between gap-2 text-sm text-gray-400"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      {size.label}
                    </span>
                    <span>({size.count})</span>
                  </label>
                ))}
                <button
                  type="button"
                  className="text-sm font-semibold text-gray-900 underline"
                >
                  View all
                </button>
              </FilterSection>

              <FilterSection title="Brand">
                <CheckboxFilterList
                  counts={brandCounts}
                  selected={selectedBrands}
                  onToggle={(value) =>
                    setSelectedBrands((current) => toggleInSet(current, value))
                  }
                />
              </FilterSection>

              <FilterSection title="Color">
                <CheckboxFilterList
                  counts={colorCounts}
                  selected={selectedColors}
                  onToggle={(value) =>
                    setSelectedColors((current) => toggleInSet(current, value))
                  }
                />
              </FilterSection>
            </div>
          </aside>

          {/* Product grid */}
          <div>
            {error ? (
              <p className="text-sm text-gray-500">Couldn’t load products. {error}</p>
            ) : loading ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index}>
                    <div className="aspect-[3/4] animate-pulse rounded-2xl bg-gray-200" />
                    <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3">
                {products.map((product) => (
                  <ShopProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No products match the selected filters.
              </p>
            )}
          </div>
        </div>
      </div>

      {showBackToTop && (
        <button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full bg-gray-900 text-white shadow-lg transition hover:bg-black"
        >
          <FiArrowUp size={16} />
          <span className="text-[10px] font-semibold">TOP</span>
        </button>
      )}
    </section>
  );
}

export default Shop;

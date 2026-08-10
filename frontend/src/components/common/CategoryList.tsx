const CATEGORIES = ["Men", "Women"];

type CategoryListProps = {
  active: string;
  onChange: (category: string) => void;
};

function CategoryList({ active, onChange }: CategoryListProps) {
  return (
    <div className="inline-flex self-start rounded-full border border-gray-300 bg-white/40 p-1">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          aria-pressed={active === category}
          className={`min-w-[76px] rounded-full px-5 py-2 text-center text-xs font-bold uppercase tracking-wide transition ${
            active === category
              ? "bg-gray-900 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default CategoryList;

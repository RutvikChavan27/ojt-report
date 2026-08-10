import { FiSearch } from "react-icons/fi";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
};

function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "What are you looking for?",
}: SearchBarProps) {
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
      className="relative"
    >
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className="w-full rounded-xl border border-gray-300 bg-transparent py-3.5 pl-11 pr-4 text-sm text-gray-400 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-gray-400"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-gray-400 transition hover:text-gray-900"
      >
        <FiSearch size={16} />
      </button>
    </form>
  );
}

export default SearchBar;

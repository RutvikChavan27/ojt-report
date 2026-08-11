import { useEffect, useRef, useState } from "react";
import { FiHeart, FiSearch, FiShoppingBag, FiUser, FiX } from "react-icons/fi";
import AuthModal from "../common/AuthModal";
import CategoryList from "../common/CategoryList";
import Logo from "../common/Logo";
import { useWishlist } from "../../store/WishlistContext";
import { useCart } from "../../store/CartContext";

type NavbarProps = {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onGoHome: () => void;
  onOpenWishlist: () => void;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

function Navbar({
  activeCategory,
  onCategoryChange,
  onGoHome,
  onOpenWishlist,
  onOpenCart,
  searchQuery,
  onSearchChange,
}: NavbarProps) {
  const { count } = useWishlist();
  const { count: cartCount } = useCart();
  const [showAuth, setShowAuth] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  const closeSearch = () => {
    setShowSearch(false);
    onSearchChange("");
  };

  return (
    <header className="relative z-50">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-10 lg:px-16">
        {/* Left: primary links + category toggle */}
        <ul className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-900 sm:gap-8">
          <li>
            <a
              href="#home"
              onClick={onGoHome}
              className="transition hover:text-gray-500"
            >
              Home
            </a>
          </li>

          <li>
            <CategoryList active={activeCategory} onChange={onCategoryChange} />
          </li>
        </ul>

        {/* Center: brand logo */}
        <Logo className="hidden sm:flex" onClick={onGoHome} />

        {/* Right: status, cart, profile */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center sm:flex">
            {showSearch && (
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") closeSearch();
                }}
                placeholder="What are you looking for?"
                aria-label="Search products"
                className="mr-2 w-44 flex-shrink-0 animate-[modal-in_0.15s_ease-out] rounded-full border border-gray-200 bg-transparent px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-400 lg:w-64"
              />
            )}
            <button
              type="button"
              aria-label={showSearch ? "Close search" : "Search"}
              onClick={() => (showSearch ? closeSearch() : setShowSearch(true))}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-900 transition hover:border-gray-400"
            >
              {showSearch ? <FiX size={16} /> : <FiSearch size={16} />}
            </button>
          </div>

          <button
            type="button"
            aria-label="Wishlist"
            onClick={onOpenWishlist}
            className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-900 transition hover:border-gray-400 sm:flex"
          >
            <FiHeart size={16} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            onClick={onOpenCart}
            className="relative flex items-center gap-3 rounded-full bg-gray-900 py-1.5 pl-5 pr-1.5 text-sm font-medium text-white transition hover:bg-black"
          >
            Cart
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-900">
              <FiShoppingBag size={13} />
            </span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-gray-900 ring-1 ring-gray-900">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-label="Account"
            onClick={() => setShowAuth(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white transition hover:bg-black"
          >
            <FiUser size={16} />
          </button>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  );
}

export default Navbar;

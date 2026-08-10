import { useState } from "react";
import { FiHeart, FiShoppingBag, FiUser } from "react-icons/fi";
import AuthModal from "../common/AuthModal";
import CategoryList from "../common/CategoryList";
import Logo from "../common/Logo";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Collections", href: "#collections" },
];

type NavbarProps = {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onGoHome: () => void;
};

function Navbar({ activeCategory, onCategoryChange, onGoHome }: NavbarProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  return (
    <header className="relative z-50">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-10 lg:px-16">
        {/* Left: primary links + category toggle */}
        <ul className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-900 sm:gap-8">
          <li>
            <a
              href={NAV_LINKS[0].href}
              onClick={onGoHome}
              className="transition hover:text-gray-500"
            >
              {NAV_LINKS[0].label}
            </a>
          </li>

          <li>
            <CategoryList active={activeCategory} onChange={onCategoryChange} />
          </li>

          {NAV_LINKS.slice(1).map((link) => (
            <li key={link.label}>
              <a href={link.href} className="transition hover:text-gray-500">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Center: brand logo */}
        <Logo className="hidden sm:flex" onClick={onGoHome} />

        {/* Right: status, cart, profile */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={isLiked ? "Unlike" : "Like"}
            aria-pressed={isLiked}
            onClick={() => setIsLiked((liked) => !liked)}
            className={`hidden h-10 w-10 items-center justify-center rounded-full border transition sm:flex ${
              isLiked
                ? "border-black-200 bg-gray-200 text-gray-500"
                : "border-gray-200 text-gray-900 hover:border-gray-400"
            }`}
          >
            <FiHeart size={16} fill={isLiked ? "currentColor" : "none"} />
          </button>

          <button
            type="button"
            className="flex items-center gap-3 rounded-full bg-gray-900 py-1.5 pl-5 pr-1.5 text-sm font-medium text-white transition hover:bg-black"
          >
            Cart
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-900">
              <FiShoppingBag size={13} />
            </span>
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

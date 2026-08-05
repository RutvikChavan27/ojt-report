import Logo from "../../assets/logo.png";

type NavbarProps = {
  onOrderClick: () => void;
};

function Navbar({ onOrderClick }: NavbarProps) {
  return (
    <header className="bg-white shadow-md">
      {/* Top Navbar */}
      <div className="bg-orange-100 p-4">
        <div className="mx-auto flex w-[92%] max-w-7xl items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src={Logo}
              alt="Shopsy Logo"
              className="h-12 w-12 object-contain"
            />

            <a
              href="#home"
              className="text-2xl font-bold text-gray-900"
            >
              Shopsy
            </a>
          </div>

          {/* Search and Order */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search products"
              className="hidden rounded-full border border-gray-300 bg-white px-4 py-2 outline-none sm:block"
            />

            <button
              type="button"
              onClick={onOrderClick}
              className="rounded-full bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
            >
              🛒 Order
            </button>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="border-t border-gray-100 p-3">
        <ul className="mx-auto flex w-[92%] max-w-7xl justify-center gap-6 text-sm font-medium text-gray-700">
          <li>
            <a
              href="#home"
              className="hover:text-orange-500"
            >
              Home
            </a>
          </li>

          <li>
            <a
              href="#products"
              className="hover:text-orange-500"
            >
              Top Rated
            </a>
          </li>

          <li>
            <a
              href="#products"
              className="hover:text-orange-500"
            >
              Kids Wear
            </a>
          </li>

          <li>
            <a
              href="#products"
              className="hover:text-orange-500"
            >
              Mens Wear
            </a>
          </li>

          <li>
            <a
              href="#products"
              className="hover:text-orange-500"
            >
              Electronics
            </a>
          </li>

          <li>
            <a
              href="#products"
              className="hover:text-orange-500"
            >
              Trending Products
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
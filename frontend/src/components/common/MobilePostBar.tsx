import { Link, useLocation } from "react-router-dom";
import { FiPlus } from "react-icons/fi";

/** Pages where a floating action would sit on top of the real one. */
const HIDDEN_ON = ["/post-ad", "/login", "/register"];

/**
 * A fixed "Post an Ad" bar on phones.
 *
 * The navbar button shrinks to an icon on small screens, and posting is the one
 * action the marketplace depends on — this keeps it reachable without scrolling
 * back to the top. Hidden on the pages where it would be redundant.
 */
function MobilePostBar() {
  const { pathname } = useLocation();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:hidden">
      <Link
        to="/post-ad"
        className="pointer-events-auto flex items-center justify-center gap-2 rounded-full bg-gray-900 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-black"
      >
        <FiPlus size={17} />
        Post an Ad
      </Link>
    </div>
  );
}

export default MobilePostBar;

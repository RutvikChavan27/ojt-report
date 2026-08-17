import { Link } from "react-router-dom";

type LogoProps = {
  className?: string;
};

/**
 * The Bazaar wordmark. Typographic rather than an image asset, so it stays crisp
 * at every size and needs nothing loaded.
 */
function Logo({ className = "" }: LogoProps) {
  return (
    <Link
      to="/home"
      className={`group flex flex-shrink-0 items-center gap-2 ${className}`}
      aria-label="Bazaar home"
    >
      {/* Badge rocks and catches a light sweep continuously; hover enlarges it. */}
      <span className="relative flex h-8 w-8 animate-[logo-sway_3s_ease-in-out_infinite] items-center justify-center overflow-hidden rounded-lg bg-gray-900 text-sm font-black text-white transition-[scale] duration-300 group-hover:scale-110 motion-reduce:animate-none">
        B
        <span className="pointer-events-none absolute inset-0 animate-[logo-shine_3.5s_ease-in-out_infinite] skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent motion-reduce:animate-none" />
      </span>

      {/* Wordmark with an underline that wipes in from the left on hover. */}
      <span className="relative inline-block text-lg font-black tracking-tight text-gray-900">
        BAZAAR
        <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-gray-900 transition-all duration-300 group-hover:w-full" />
      </span>
    </Link>
  );
}

export default Logo;

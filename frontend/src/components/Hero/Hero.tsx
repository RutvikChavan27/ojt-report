type HeroProps = {
  onOrderClick: () => void;
};

function Hero({ onOrderClick }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gray-50">
      <div className="mx-auto grid w-[92%] max-w-7xl items-center gap-10 py-14 md:grid-cols-2">
        
        {/* Left side: text content */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold leading-tight text-gray-900 md:text-6xl">
            Upto 50% off on
            <span className="block">all Men's Wear</span>
          </h1>

          <p className="mt-6 max-w-md leading-7 text-gray-600">
            Discover the latest fashion, trending styles, and
            exciting offers. Shop your favourite products at
            the best prices.
          </p>

          <button
            type="button"
            onClick={onOrderClick}
            className="mt-7 rounded-full bg-orange-500 px-7 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Order Now
          </button>
        </div>

        {/* Right side: image with diamond background */}
        <div className="relative flex items-center justify-center">
          {/* Orange diamond shape behind the image */}
          <div className="absolute h-80 w-80 rotate-45 rounded-3xl bg-orange-200 md:h-96 md:w-96" />

          {/* Replace this placeholder with your real photo */}
          <img
            src="/src/assets/women.png"
            alt="Model with shopping bags"
            className="relative z-10 h-105 w-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;
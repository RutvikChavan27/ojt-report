// Import React hooks
import { useEffect, useState } from "react";
// Import Navbar component
import Navbar from "../../components/Navbar/Navbar";

function Dashboard() {
    // State to open and close the Order Popup
  const [showPopup, setShowPopup] = useState(false);
  // State to track the currently displayed slider
  const [currentSlide, setCurrentSlide] = useState(0);

const slides = [
  {
    title: "Up to 50% Off on",
    highlight: "All Men's Wear",
    description:
      "Discover the latest fashion trends and shop your favourite products at amazing prices.",
    image: "👕",
    label: "Men's Collection",
  },
  {
    title: "New Styles for",
    highlight: "Women's Fashion",
    description:
      "Explore beautiful dresses, stylish outfits, and exciting fashion offers.",
    image: "👗",
    label: "Women's Collection",
  },
  {
    title: "Best Deals on",
    highlight: "Smart Electronics",
    description:
      "Shop headphones, gadgets, and the latest electronics at great prices.",
    image: "🎧",
    label: "Electronics Collection",
  },
];
// Automatically change the Hero slider every 4 seconds
useEffect(() => {
  const slider = setInterval(() => {
    setCurrentSlide((previousSlide) =>
      previousSlide === slides.length - 1
        ? 0
        : previousSlide + 1
    );
  }, 4000);

  return () => clearInterval(slider);
}, [slides.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar onOrderClick={() => setShowPopup(true)} />

      <main>
        {/* Hero Section */}
        <section
  id="home"
  className="relative overflow-hidden bg-orange-50"
>
  <div className="mx-auto min-h-130 w-[92%] max-w-7xl">
    {slides.map((slide, index) => (
      <div
        key={slide.label}
        className={`grid min-h-130 items-center gap-10 py-12 transition-all duration-700 md:grid-cols-2 ${
          currentSlide === index
            ? "relative opacity-100"
            : "absolute inset-0 opacity-0 pointer-events-none"
        }`}
      >
        {/* Left content */}
        <div>
          <p className="text-sm font-bold uppercase tracking-[3px] text-orange-500">
            {slide.label}
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
            {slide.title}

            <span className="block text-orange-500">
              {slide.highlight}
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-gray-600">
            {slide.description}
          </p>

          <button
            type="button"
            onClick={() => setShowPopup(true)}
            className="mt-7 rounded-full bg-orange-500 px-7 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Order Now
          </button>
        </div>

        {/* Right image */}
        <div className="flex justify-center">
          <div className="flex h-72 w-72 items-center justify-center rounded-full bg-orange-200 text-8xl shadow-xl sm:h-96 sm:w-96 sm:text-9xl">
            {slide.image}
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Previous button */}
  <button
    type="button"
    onClick={() =>
      setCurrentSlide(
        currentSlide === 0
          ? slides.length - 1
          : currentSlide - 1
      )
    }
    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 px-4 py-3 text-xl shadow hover:bg-white"
  >
    ←
  </button>

  {/* Next button */}
  <button
    type="button"
    onClick={() =>
      setCurrentSlide(
        currentSlide === slides.length - 1
          ? 0
          : currentSlide + 1
      )
    }
    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 px-4 py-3 text-xl shadow hover:bg-white"
  >
    →
  </button>

  {/* Slider dots */}
  <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
    {slides.map((slide, index) => (
      <button
        key={slide.label}
        type="button"
        onClick={() => setCurrentSlide(index)}
        className={`h-3 rounded-full transition-all ${
          currentSlide === index
            ? "w-8 bg-orange-500"
            : "w-3 bg-orange-200"
        }`}
        aria-label={`Go to slide ${index + 1}`}
      />
    ))}
  </div>
</section>
      </main>

{/* Why Choose Us */}
<section className="bg-orange-50 py-20">
  <div className="mx-auto w-[92%] max-w-7xl">
    
    <div className="text-center">
      <p className="font-semibold text-orange-500">
        Why Choose Shopsy?
      </p>

      <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
        Shopping Made Easy
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-gray-600">
        We provide quality products, great offers, and a smooth
        shopping experience.
      </p>
    </div>

    <div className="mt-12 grid gap-6 md:grid-cols-3">
      
      {/* Card 1 */}
      <div className="group rounded-3xl bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl transition duration-300 group-hover:scale-110">
          🚚
        </div>

        <h3 className="mt-5 text-xl font-bold text-gray-900">
          Fast Delivery
        </h3>

        <p className="mt-3 leading-7 text-gray-600">
          Get your favourite products delivered quickly
          and safely to your doorstep.
        </p>
      </div>

      {/* Card 2 */}
      <div className="group rounded-3xl bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl transition duration-300 group-hover:scale-110">
          ⭐
        </div>

        <h3 className="mt-5 text-xl font-bold text-gray-900">
          Quality Products
        </h3>

        <p className="mt-3 leading-7 text-gray-600">
          Explore stylish and high-quality products
          selected especially for you.
        </p>
      </div>

      {/* Card 3 */}
      <div className="group rounded-3xl bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl transition duration-300 group-hover:scale-110">
          🔒
        </div>

        <h3 className="mt-5 text-xl font-bold text-gray-900">
          Secure Shopping
        </h3>

        <p className="mt-3 leading-7 text-gray-600">
          Your shopping experience is simple,
          secure, and reliable.
        </p>
      </div>
    </div>
  </div>
</section>

{/* Special Offer */}
<section className="bg-white py-20">
  <div className="mx-auto w-[92%] max-w-7xl">
    
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-orange-500 to-amber-400 px-8 py-14 text-center text-white shadow-xl sm:px-16">
      
      {/* Decorative circles */}
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10"></div>

      <div className="absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-white/10"></div>

      <div className="relative">
        <p className="text-sm font-semibold uppercase tracking-[4px]">
          Limited Time Offer
        </p>

        <h2 className="mt-4 text-3xl font-bold sm:text-5xl">
          Get 20% Off on Your First Order
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-white/90">
          Sign up today and enjoy exclusive offers,
          exciting discounts, and new product updates.
        </p>

        <button
          type="button"
          onClick={() => setShowPopup(true)}
          className="mt-7 rounded-full bg-white px-8 py-3 font-bold text-orange-500 transition duration-300 hover:scale-105 hover:shadow-lg"
        >
          Shop Now
        </button>
      </div>
    </div>
  </div>
</section>


      {/* Footer */}
     <footer className="bg-gray-950 text-white">
  <div className="mx-auto grid w-[92%] max-w-7xl gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
    
    {/* Brand */}
    <div>
      <h2 className="text-3xl font-bold">
        🛍️ Shopsy
      </h2>

      <p className="mt-4 leading-7 text-gray-400">
        Discover trending fashion, quality products,
        and exciting offers all in one place.
      </p>

      <div className="mt-5 flex gap-3">
        <span className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 transition hover:scale-110 hover:bg-orange-500">
          f
        </span>

        <span className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 transition hover:scale-110 hover:bg-orange-500">
          i
        </span>

        <span className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 transition hover:scale-110 hover:bg-orange-500">
          ▶
        </span>
      </div>
    </div>

    {/* Quick Links */}
    <div>
      <h3 className="text-lg font-bold">
        Quick Links
      </h3>

      <ul className="mt-5 space-y-3 text-gray-400">
        <li>
          <a href="#home" className="transition hover:text-orange-400">
            Home
          </a>
        </li>

        <li>
          <a href="#products" className="transition hover:text-orange-400">
            Products
          </a>
        </li>

        <li>
          <a href="#products" className="transition hover:text-orange-400">
            Top Rated
          </a>
        </li>

        <li>
          <a href="#home" className="transition hover:text-orange-400">
            Offers
          </a>
        </li>
      </ul>
    </div>

    {/* Customer Service */}
    <div>
      <h3 className="text-lg font-bold">
        Customer Service
      </h3>

      <ul className="mt-5 space-y-3 text-gray-400">
        <li className="transition hover:text-orange-400">
          Help Center
        </li>

        <li className="transition hover:text-orange-400">
          Shipping Information
        </li>

        <li className="transition hover:text-orange-400">
          Returns & Refunds
        </li>

        <li className="transition hover:text-orange-400">
          Contact Us
        </li>
      </ul>
    </div>

    {/* Newsletter */}
    <div>
      <h3 className="text-lg font-bold">
        Stay Updated
      </h3>

      <p className="mt-5 leading-7 text-gray-400">
        Subscribe to receive new offers and
        latest product updates.
      </p>

      <div className="mt-5 flex overflow-hidden rounded-full bg-white">
        <input
          type="email"
          placeholder="Your email"
          className="min-w-0 flex-1 px-4 py-3 text-sm text-gray-900 outline-none"
        />

        <button
          type="button"
          className="bg-orange-500 px-5 font-semibold text-white transition hover:bg-orange-600"
        >
          Join
        </button>
      </div>
    </div>
  </div>

  {/* Bottom footer */}
  <div className="border-t border-white/10">
    <div className="mx-auto flex w-[92%] max-w-7xl flex-col items-center justify-between gap-3 py-6 text-sm text-gray-500 md:flex-row">
      
      <p>
        © 2026 Shopsy. All rights reserved.
      </p>

      <div className="flex gap-5">
        <span className="cursor-pointer transition hover:text-orange-400">
          Privacy Policy
        </span>

        <span className="cursor-pointer transition hover:text-orange-400">
          Terms & Conditions
        </span>
      </div>
    </div>
  </div>
</footer>

      {/* Order Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Place Your Order
              </h2>

              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="text-2xl text-gray-500 hover:text-black"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              placeholder="Your name"
              className="mt-6 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />

            <input
              type="email"
              placeholder="Email address"
              className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />

            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="mt-5 w-full rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600"
            >
              Confirm Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
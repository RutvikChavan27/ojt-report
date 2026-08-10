import { useEffect, useState } from "react";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import SearchBar from "../common/SearchBar";
import ImageCarousel from "../common/ImageCarousel";
import heroLook1 from "../../assets/hero-look-1.jpg";
import heroLook1b from "../../assets/hero-look-1b.jpg";
import heroLook1c from "../../assets/hero-look-1c.jpg";
import heroLook2 from "../../assets/hero-look-2.jpg";
import heroLook2b from "../../assets/hero-look-2b.jpg";
import heroLook2c from "../../assets/hero-look-2c.jpg";
import heroLook3 from "../../assets/hero-look-3.jpg";
import heroLook3b from "../../assets/hero-look-3b.jpg";
import heroLookWomen1 from "../../assets/hero-look-women-1.jpg";
import heroLookWomen2 from "../../assets/hero-look-women-2.jpg";
import heroLookWomen3 from "../../assets/hero-look-women-3.jpg";
import heroLookWomen4 from "../../assets/hero-look-women-4.jpg";
import heroLookWomen5 from "../../assets/hero-look-women-5.jpg";
import heroLookWomen6 from "../../assets/hero-look-women-6.jpg";
import heroLookWomen7 from "../../assets/hero-look-women-7.jpg";
import heroLookWomen8 from "../../assets/hero-look-women-8.jpg";

type HeroProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategory: string;
  onGoToShopClick: () => void;
};

const MEN_LOOKS = [
  { src: heroLook1, alt: "Model wearing cream trousers and white sneakers" },
  { src: heroLook1b, alt: "Model seated wearing khaki trousers and sneakers" },
  { src: heroLook1c, alt: "Model wearing ripped denim jeans and sneakers" },
  { src: heroLook2, alt: "Model wearing a graphic t-shirt with visible tattoos" },
  { src: heroLook2b, alt: "Model wearing a white graphic print t-shirt" },
  { src: heroLook2c, alt: "Model wearing a graphic t-shirt with a backpack" },
  { src: heroLook3, alt: "Model wearing a matching grey gingham co-ord set with white sneakers" },
  { src: heroLook3b, alt: "Model wearing a plaid shirt-jacket over a mustard turtleneck" },
];

const WOMEN_LOOKS = [
  { src: heroLookWomen1, alt: "Model wearing women's look 1" },
  { src: heroLookWomen2, alt: "Model wearing women's look 2" },
  { src: heroLookWomen3, alt: "Model wearing women's look 3" },
  { src: heroLookWomen4, alt: "Model wearing women's look 4" },
  { src: heroLookWomen5, alt: "Model wearing women's look 5" },
  { src: heroLookWomen6, alt: "Model wearing women's look 6" },
  { src: heroLookWomen7, alt: "Model wearing women's look 7" },
  { src: heroLookWomen8, alt: "Model wearing women's look 8" },
];

const LOOKS_PAGE_SIZE = 4;

function Hero({
  searchQuery,
  onSearchChange,
  activeCategory,
  onGoToShopClick,
}: HeroProps) {
  const [lookPage, setLookPage] = useState(0);

  const allLooks = activeCategory === "Women" ? WOMEN_LOOKS : MEN_LOOKS;
  const looksPageCount = Math.ceil(allLooks.length / LOOKS_PAGE_SIZE);

  useEffect(() => {
    setLookPage(0);
  }, [activeCategory]);

  const goToPrevious = () =>
    setLookPage((current) => (current - 1 + looksPageCount) % looksPageCount);
  const goToNext = () =>
    setLookPage((current) => (current + 1) % looksPageCount);

  const visibleLooks = allLooks.slice(
    lookPage * LOOKS_PAGE_SIZE,
    lookPage * LOOKS_PAGE_SIZE + LOOKS_PAGE_SIZE
  );

  return (
    <section id="home">
      <div className="mx-auto w-full px-6 pb-14 sm:px-10 lg:px-16">
        <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar: categories, search, heading, CTA */}
          <div className="flex flex-col gap-6">
            <SearchBar
              value={searchQuery}
              onChange={onSearchChange}
              onSubmit={() =>
                document
                  .getElementById("new")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            />

            <div>
              <h1 className="text-4xl font-black leading-[0.95] tracking-tight text-gray-900 sm:text-5xl">
                NEW
                <br />
                COLLECTION
              </h1>

              <div className="mt-3 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-900 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-900" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
                  Live This Week
                </span>
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Summer
                <br />
                2024
              </p>

              <button
                type="button"
                onClick={onGoToShopClick}
                className="mt-8 flex items-center gap-3 rounded-full border border-gray-300 bg-transparent py-3 pl-6 pr-3 text-sm font-semibold text-gray-900 transition hover:bg-black/5"
              >
                Go To Shop
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                  <FiArrowRight size={14} />
                </span>
              </button>
            </div>
          </div>

          {/* Lookbook images: 4 at a time, arrow brings in the next 4 */}
          <div className="flex items-center gap-3 lg:mt-[80px]">
            <button
              type="button"
              aria-label="Previous looks"
              onClick={goToPrevious}
              className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 hover:text-gray-900 sm:flex"
            >
              <FiChevronLeft size={18} />
            </button>

            <div className="flex flex-1 gap-3 sm:gap-4">
              {visibleLooks.map((look) => (
                <ImageCarousel
                  key={look.src}
                  slides={[look]}
                  activeIndex={0}
                  sizeClassName="aspect-[3/4] w-full max-w-64 flex-1"
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next looks"
              onClick={goToNext}
              className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 hover:text-gray-900 sm:flex"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

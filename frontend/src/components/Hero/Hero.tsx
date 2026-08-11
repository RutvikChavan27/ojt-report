import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
} from "react-icons/fi";
import ImageCarousel from "../common/ImageCarousel";
import {
  fetchHeroLooks,
  fetchListings,
  fetchProducts,
  type HeroLook,
  type Product,
} from "../../lib/api";
import { useApi } from "../../hooks/useApi";
import { useWishlist } from "../../store/WishlistContext";

type HeroProps = {
  activeCategory: string;
  onGoToShopClick: () => void;
  onSelectProduct?: (product: Product) => void;
};

const LOOKS_PAGE_SIZE = 4;

function Hero({ activeCategory, onGoToShopClick, onSelectProduct }: HeroProps) {
  const [lookPage, setLookPage] = useState(0);
  const { isWishlisted, toggle } = useWishlist();

  const { data, loading, error } = useApi(
    () => fetchHeroLooks(activeCategory),
    [activeCategory],
  );
  const allLooks = data ?? [];

  // Needed to turn a look's productSlug into the full product the detail page wants.
  const { data: productData } = useApi(
    () => fetchProducts(activeCategory),
    [activeCategory],
  );

  // perPage 1 because only the total is wanted, not the rows.
  const { data: listingPage } = useApi(
    () => fetchListings({ audience: activeCategory, perPage: 1 }),
    [activeCategory],
  );
  const liveCount = listingPage?.total;

  /**
   * Opens the linked product, leading with the look photo that was clicked so
   * the detail page shows the image you came from (its own shot follows in the
   * gallery). Falls back to the shop when a look has no linked product.
   */
  const openLook = (look: HeroLook) => {
    const product = look.productSlug
      ? productData?.find((candidate) => candidate.id === look.productSlug)
      : undefined;

    if (product && onSelectProduct) {
      onSelectProduct({
        ...product,
        image: look.src,
        images: [look.src, ...product.images.filter((src) => src !== look.src)],
      });
      return;
    }
    onGoToShopClick();
  };
  const looksPageCount = Math.max(1, Math.ceil(allLooks.length / LOOKS_PAGE_SIZE));

  // Reset to the first page whenever the category (and therefore the set) changes.
  useEffect(() => {
    setLookPage(0);
  }, [activeCategory]);

  const goToPrevious = () =>
    setLookPage((current) => (current - 1 + looksPageCount) % looksPageCount);
  const goToNext = () =>
    setLookPage((current) => (current + 1) % looksPageCount);

  const visibleLooks = allLooks.slice(
    lookPage * LOOKS_PAGE_SIZE,
    lookPage * LOOKS_PAGE_SIZE + LOOKS_PAGE_SIZE,
  );

  return (
    <section id="home">
      <div className="mx-auto w-full px-6 pb-14 sm:px-10 lg:px-16">
        <div className="grid items-start gap-6 lg:grid-cols-[230px_1fr] lg:gap-12">
          {/* Sidebar: heading, CTA. The top padding matches the strip's offset
              below, so the heading starts level with the photos instead of
              floating 80px above them. */}
          <div className="flex flex-col gap-6 lg:pt-20">
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

              {/* Real count rather than a hardcoded season, so the hero says
                  something true about the marketplace. */}
              <p className="mt-4 text-sm text-gray-500">
                {liveCount === undefined
                  ? "Preloved pieces"
                  : `${liveCount.toLocaleString("en-IN")} preloved pieces`}
                <br />
                ready for a second life
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

          {/* Collection strip: one product per garment type, 4 at a time. */}
          <div className="flex items-center gap-3 lg:mt-[80px]">
            {looksPageCount > 1 && (
              <button
                type="button"
                aria-label="Previous looks"
                onClick={goToPrevious}
                className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 hover:text-gray-900 sm:flex"
              >
                <FiChevronLeft size={18} />
              </button>
            )}

            {/* Two-up on phones — four across a 440px screen left each tile
                87px wide. Four across only once there is room for it. */}
            <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {error ? (
                <p className="py-10 text-sm text-gray-500">
                  Couldn’t load the lookbook. {error}
                </p>
              ) : loading ? (
                Array.from({ length: LOOKS_PAGE_SIZE }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[3/4] w-full animate-pulse rounded-3xl bg-gray-200"
                  />
                ))
              ) : (
                visibleLooks.map((look) => {
                  const liked = isWishlisted(look.src);
                  return (
                    <button
                      key={look.src}
                      type="button"
                      onClick={() => openLook(look)}
                      aria-label={`Shop the look: ${look.alt}`}
                      className="aspect-[3/4] w-full text-left"
                    >
                      <ImageCarousel
                        slides={[look]}
                        activeIndex={0}
                        sizeClassName="h-full w-full"
                        overlay={
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                            aria-pressed={liked}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggle({ id: look.src, name: look.alt, image: look.src });
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.stopPropagation();
                                event.preventDefault();
                                toggle({ id: look.src, name: look.alt, image: look.src });
                              }
                            }}
                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm transition hover:scale-105"
                          >
                            <FiHeart size={15} fill={liked ? "currentColor" : "none"} />
                          </span>
                        }
                      />
                    </button>
                  );
                })
              )}
            </div>

            {looksPageCount > 1 && (
              <button
                type="button"
                aria-label="Next looks"
                onClick={goToNext}
                className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 hover:text-gray-900 sm:flex"
              >
                <FiChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

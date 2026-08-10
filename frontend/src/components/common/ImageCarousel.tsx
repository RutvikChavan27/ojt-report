import type { ReactNode } from "react";

type Slide = {
  src: string;
  alt: string;
};

type ImageCarouselProps = {
  slides: Slide[];
  activeIndex: number;
  onSelect?: (index: number) => void;
  sizeClassName?: string;
  roundedClassName?: string;
  showDots?: boolean;
  overlay?: ReactNode;
};

function ImageCarousel({
  slides,
  activeIndex,
  onSelect,
  sizeClassName = "aspect-square w-full max-w-xs",
  roundedClassName = "rounded-3xl",
  showDots = true,
  overlay,
}: ImageCarouselProps) {
  return (
    <div
      className={`group relative overflow-hidden bg-gray-200 shadow-lg transition duration-300 hover:shadow-xl ${roundedClassName} ${sizeClassName}`}
    >
      <div
        className="flex h-full transition-transform duration-1200 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className="h-full w-full flex-shrink-0 object-cover transition duration-500 group-hover:scale-105"
          />
        ))}
      </div>

      {overlay}

      {showDots && slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              onClick={() => onSelect?.(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageCarousel;

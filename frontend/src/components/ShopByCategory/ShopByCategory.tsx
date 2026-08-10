import tShirts from "../../assets/product-slim-fit-tee.jpg";
import graphicTees from "../../assets/hero-look-2.jpg";
import shirts from "../../assets/product-seersucker-shirt.jpg";
import denim from "../../assets/hero-look-1c.jpg";
import trousers from "../../assets/hero-look-1.jpg";
import knitwear from "../../assets/product-blurred-print-tee-2.jpg";
import hoodies from "../../assets/product-fleece-hoodie.jpg";
import coOrds from "../../assets/hero-look-3.jpg";
import streetStyle from "../../assets/hero-look-2c.jpg";
import weekendLooks from "../../assets/hero-look-3b.jpg";
import womenTops from "../../assets/category-women-tops.jpg";
import womenDresses from "../../assets/category-women-dresses.jpg";
import womenBlouses from "../../assets/category-women-blouses.jpg";
import womenDenim from "../../assets/category-women-denim.jpg";
import womenSkirts from "../../assets/category-women-skirts.jpg";
import womenKnitwear from "../../assets/category-women-knitwear.jpg";
import womenLoungewear from "../../assets/category-women-loungewear.jpg";
import womenCoOrds from "../../assets/category-women-coords.jpg";
import womenActivewear from "../../assets/category-women-activewear.jpg";
import womenOuterwear from "../../assets/category-women-outerwear.jpg";

const MEN_CATEGORIES = [
  { label: "T-shirts", image: tShirts },
  { label: "Graphic Tees", image: graphicTees },
  { label: "Shirts", image: shirts },
  { label: "Denim", image: denim },
  { label: "Trousers", image: trousers },
  { label: "Knitwear", image: knitwear },
  { label: "Hoodies", image: hoodies },
  { label: "Co-ords", image: coOrds },
  { label: "Street Style", image: streetStyle },
  { label: "Weekend Looks", image: weekendLooks },
];

const WOMEN_CATEGORIES = [
  { label: "Tops", image: womenTops },
  { label: "Dresses", image: womenDresses },
  { label: "Blouses", image: womenBlouses },
  { label: "Denim", image: womenDenim },
  { label: "Skirts", image: womenSkirts },
  { label: "Knitwear", image: womenKnitwear },
  { label: "Loungewear", image: womenLoungewear },
  { label: "Co-ords", image: womenCoOrds },
  { label: "Activewear", image: womenActivewear },
  { label: "Outerwear", image: womenOuterwear },
];

type ShopByCategoryProps = {
  activeCategory: string;
};

function ShopByCategory({ activeCategory }: ShopByCategoryProps) {
  const categories = activeCategory === "Women" ? WOMEN_CATEGORIES : MEN_CATEGORIES;

  return (
    <section id="collections" className="pb-16">
      <div className="mx-auto w-full px-6 sm:px-10 lg:px-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-black leading-none tracking-tight text-gray-900 sm:text-4xl">
            SHOP BY CATEGORY
          </h2>

          <a
            href="#new"
            className="pb-1 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            See All
          </a>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-5">
          {categories.map((category) => (
            <a
              key={category.label}
              href="#new"
              className="group relative aspect-[4/5] overflow-hidden"
            >
              <img
                src={category.image}
                alt={category.label}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 text-lg font-bold text-white">
                {category.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ShopByCategory;

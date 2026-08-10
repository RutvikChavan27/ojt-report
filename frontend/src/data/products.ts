import seersuckerShirt from "../assets/product-seersucker-shirt.jpg";
import seersuckerShirt2 from "../assets/product-seersucker-shirt-2.jpg";
import slimFitTee from "../assets/product-slim-fit-tee.jpg";
import blurredPrintTee from "../assets/product-blurred-print-tee.jpg";
import blurredPrintTee2 from "../assets/product-blurred-print-tee-2.jpg";
import zipCrewneck from "../assets/product-zip-crewneck.jpg";
import zipCrewneck2 from "../assets/product-zip-crewneck-2.jpg";
import fleeceHoodie from "../assets/product-fleece-hoodie.jpg";
import wrapBlouse from "../assets/product-women-wrap-blouse.jpg";
import cropTop from "../assets/product-women-crop-top.jpg";
import tieDyeTee from "../assets/product-women-tie-dye-tee.jpg";
import wideJeans from "../assets/product-women-wide-jeans.jpg";
import midiSkirt from "../assets/product-women-midi-skirt.jpg";
import cardigan from "../assets/product-women-cardigan.jpg";
import slipDress from "../assets/product-women-slip-dress.jpg";
import pufferJacket from "../assets/product-women-puffer-jacket.jpg";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  brand: string;
  color: string;
  variantCount?: number;
};

export const MEN_PRODUCTS: Product[] = [
  {
    id: "seersucker-shirt",
    name: "Embroidered Seersucker Shirt",
    category: "V-Neck T Shirt",
    price: 99,
    originalPrice: 199,
    rating: 4.6,
    image: seersuckerShirt,
    brand: "Thread Studio",
    color: "Blue",
  },
  {
    id: "slim-fit-tee",
    name: "Basic Slim Fit T-Shirt",
    category: "Cotton T Shirt",
    price: 99,
    originalPrice: 179,
    rating: 4.3,
    variantCount: 3,
    image: slimFitTee,
    brand: "Thread Essentials",
    color: "White",
  },
  {
    id: "henley-tee",
    name: "Blurred Print T-Shirt",
    category: "Henley T Shirt",
    price: 99,
    originalPrice: 189,
    rating: 4.5,
    variantCount: 3,
    image: blurredPrintTee,
    brand: "Thread Studio",
    color: "Beige",
  },
  {
    id: "zip-crewneck",
    name: "Full Sleeve Zipper",
    category: "Crewneck T Shirt",
    price: 99,
    originalPrice: 199,
    rating: 4.7,
    variantCount: 2,
    image: zipCrewneck,
    brand: "Thread Essentials",
    color: "White",
  },
  {
    id: "dotted-chambray-shirt",
    name: "Dotted Chambray Shirt",
    category: "Button-Up Shirt",
    price: 89,
    originalPrice: 169,
    rating: 4.4,
    image: seersuckerShirt2,
    brand: "Thread Denim Co.",
    color: "Blue",
  },
  {
    id: "knit-sweater",
    name: "Textured Knit Sweater",
    category: "Crewneck Sweater",
    price: 109,
    originalPrice: 219,
    rating: 4.8,
    image: blurredPrintTee2,
    brand: "Thread Studio",
    color: "White",
  },
  {
    id: "graphic-print-tee",
    name: "Graphic Print Tee",
    category: "Oversized T Shirt",
    price: 79,
    originalPrice: 159,
    rating: 4.2,
    variantCount: 4,
    image: zipCrewneck2,
    brand: "Thread Essentials",
    color: "Yellow",
  },
  {
    id: "fleece-hoodie",
    name: "Folded Fleece Hoodie",
    category: "Pullover Hoodie",
    price: 119,
    originalPrice: 229,
    rating: 4.6,
    image: fleeceHoodie,
    brand: "Thread Studio",
    color: "Navy",
  },
];

export const WOMEN_PRODUCTS: Product[] = [
  {
    id: "wrap-blouse",
    name: "Floral Wrap Blouse",
    category: "Wrap Top",
    price: 99,
    originalPrice: 189,
    rating: 4.5,
    image: wrapBlouse,
    brand: "Thread Studio",
    color: "Cream",
  },
  {
    id: "crop-top",
    name: "Ribbed Crop Top",
    category: "Crop Top",
    price: 99,
    originalPrice: 179,
    rating: 4.3,
    variantCount: 3,
    image: cropTop,
    brand: "Thread Essentials",
    color: "Cream",
  },
  {
    id: "tie-dye-tee",
    name: "Tie-Dye Oversized Tee",
    category: "Graphic Tee",
    price: 99,
    originalPrice: 189,
    rating: 4.6,
    variantCount: 3,
    image: tieDyeTee,
    brand: "Thread Essentials",
    color: "Black",
  },
  {
    id: "wide-jeans",
    name: "High-Waist Wide Jeans",
    category: "Wide-Leg Jeans",
    price: 99,
    originalPrice: 199,
    rating: 4.7,
    variantCount: 2,
    image: wideJeans,
    brand: "Thread Denim Co.",
    color: "Blue",
  },
  {
    id: "midi-skirt",
    name: "Pleated Midi Skirt",
    category: "Midi Skirt",
    price: 89,
    originalPrice: 169,
    rating: 4.4,
    image: midiSkirt,
    brand: "Thread Studio",
    color: "Rust",
  },
  {
    id: "cardigan",
    name: "Cable Knit Cardigan",
    category: "Cardigan",
    price: 109,
    originalPrice: 219,
    rating: 4.8,
    image: cardigan,
    brand: "Thread Studio",
    color: "Brown",
  },
  {
    id: "slip-dress",
    name: "Satin Slip Dress",
    category: "Slip Dress",
    price: 79,
    originalPrice: 159,
    rating: 4.5,
    variantCount: 4,
    image: slipDress,
    brand: "Thread Studio",
    color: "Red",
  },
  {
    id: "puffer-jacket",
    name: "Cropped Puffer Jacket",
    category: "Puffer Jacket",
    price: 119,
    originalPrice: 229,
    rating: 4.6,
    image: pufferJacket,
    brand: "Thread Essentials",
    color: "Yellow",
  },
];

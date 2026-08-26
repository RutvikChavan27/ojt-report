/**
 * Mock marketplace data for the frontend.
 *
 * Stands in for the API until the backend is reseeded with classifieds
 * categories — the shape below is deliberately the shape a listings endpoint
 * would return, so swapping this module for `fetch` calls touches nothing else.
 *
 * Everything is derived deterministically from a seed so the same listing keeps
 * the same photo, seller and date across reloads. Random data would make facet
 * counts move about between renders and hide real bugs.
 */

export type Condition = "New" | "Like New" | "Good" | "Fair";

export type ListingStatus = "active" | "sold" | "expired";

export type Seller = {
  name: string;
  memberSince: string;
  /** Deliberately partial — the full number appears only after "Contact". */
  phoneMasked: string;
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  /** Category slug, e.g. "mobiles". */
  category: string;
  /** Human label for that slug, e.g. "Mobiles". */
  categoryLabel: string;
  condition: Condition;
  /** Neighbourhood or area. */
  location: string;
  city: string;
  /** Cover photo. */
  image: string;
  images: string[];
  seller: Seller;
  /** ISO timestamp. */
  postedAt: string;
  views: number;
  status: ListingStatus;
};

export type Category = {
  slug: string;
  label: string;
};

/**
 * The marketplace's categories.
 *
 * Slugs and labels must match `listing_categories` in the database exactly: the
 * components still reading this array (header menu, footer, Post Ad dropdown)
 * link to `/search?category=<slug>`, and a slug with no server-side counterpart
 * renders an empty results page.
 *
 * This is the last hardcoded copy. Everything already migrated reads the same
 * list from /api/listing-categories, and this goes with the rest of the fixture
 * once those components follow.
 */
export const CATEGORIES: Category[] = [
  { slug: "mobiles", label: "Mobiles" },
  { slug: "electronics", label: "Electronics & Appliances" },
  { slug: "computers", label: "Computers & Laptops" },
  { slug: "cars", label: "Cars" },
  { slug: "bikes", label: "Bikes" },
  { slug: "furniture", label: "Furniture" },
  { slug: "home-kitchen", label: "Home & Kitchen" },
  { slug: "mens-fashion", label: "Men's Fashion" },
  { slug: "womens-fashion", label: "Women's Fashion" },
  { slug: "books-stationery", label: "Books & Stationery" },
  { slug: "sports", label: "Sports & Fitness" },
  { slug: "toys", label: "Toys & Games" },
  { slug: "music", label: "Musical Instruments" },
  { slug: "cameras", label: "Cameras & Photography" },
  { slug: "pets", label: "Pets & Pet Supplies" },
  { slug: "accessories", label: "Accessories" },
];

/** City plus the areas listings are placed in, so locations read realistically. */
const CITIES: { city: string; areas: string[] }[] = [
  { city: "Pune", areas: ["Kothrud", "Baner", "Viman Nagar", "Hadapsar"] },
  { city: "Mumbai", areas: ["Andheri West", "Bandra", "Powai", "Thane"] },
  { city: "Bengaluru", areas: ["Koramangala", "Indiranagar", "Whitefield"] },
  { city: "Delhi", areas: ["Saket", "Dwarka", "Rohini"] },
  { city: "Hyderabad", areas: ["Gachibowli", "Madhapur", "Kukatpally"] },
  { city: "Chennai", areas: ["Adyar", "Velachery", "Anna Nagar"] },
  { city: "Ahmedabad", areas: ["Satellite", "Bopal"] },
  { city: "Jaipur", areas: ["Vaishali Nagar", "Malviya Nagar"] },
];

export const CITY_NAMES = CITIES.map((entry) => entry.city);

const SELLER_NAMES = [
  "Rahul",
  "Priya",
  "Amit",
  "Sneha",
  "Vikram",
  "Anjali",
  "Karan",
  "Meera",
  "Rohit",
  "Divya",
  "Arjun",
  "Neha",
];

/**
 * A tiny deterministic hash. Used instead of Math.random so every derived field
 * is stable for a given listing id.
 */
function hash(seed: string): number {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

const pick = <T,>(items: T[], seed: string, salt = ""): T =>
  items[hash(seed + salt) % items.length];

/** Muted card backgrounds, so a grid of placeholders still looks composed. */
const SWATCHES = [
  ["#e7e5e4", "#57534e"],
  ["#e4e4e7", "#52525b"],
  ["#e7e5e4", "#44403c"],
  ["#e5e7eb", "#4b5563"],
  ["#e7e5e4", "#3f3f46"],
];

/**
 * An inline SVG placeholder carrying the category name.
 *
 * A generic stock-photo service was rejected earlier for returning pictures
 * unrelated to the listing — a landscape under "iPhone 15" looks broken. A
 * labelled placeholder is honest about being a placeholder, needs no network,
 * and is swapped out the moment real uploads exist.
 */
export function placeholderImage(label: string, seed: string): string {
  const [background, ink] = pick(SWATCHES, seed, "swatch");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
<rect width="600" height="450" fill="${background}"/>
<text x="300" y="228" text-anchor="middle" font-family="system-ui,sans-serif" font-size="26" font-weight="700" fill="${ink}" opacity="0.55">${label}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** [title, category slug, price, condition] — the parts worth writing by hand. */
const SEED_ROWS: [string, string, number, Condition][] = [
  ["iPhone 15 128GB", "mobiles", 48000, "Like New"],
  ["Samsung Galaxy S23 Ultra", "mobiles", 52000, "Good"],
  ["OnePlus 11R 256GB", "mobiles", 27500, "Like New"],
  ["Google Pixel 7a", "mobiles", 21000, "Good"],
  ["Redmi Note 12 Pro", "mobiles", 12500, "Good"],
  ["iPhone 12 64GB", "mobiles", 24000, "Fair"],
  ["Royal Enfield Classic 350", "bikes", 145000, "Good"],
  ["Honda Activa 6G", "bikes", 62000, "Good"],
  ["Bajaj Pulsar NS200", "bikes", 88000, "Like New"],
  ["Yamaha FZ-S V3", "bikes", 79000, "Good"],
  ["Maruti Suzuki Swift VXi", "cars", 425000, "Good"],
  ["Hyundai i20 Sportz", "cars", 610000, "Like New"],
  ["Tata Nexon XZ+", "cars", 785000, "Like New"],
  ["Honda City ZX", "cars", 540000, "Fair"],
  ["Dell Inspiron 15 i5 Laptop", "electronics", 32000, "Good"],
  ["Samsung 43\" 4K LED TV", "electronics", 23500, "Like New"],
  ["Canon EOS 1500D DSLR", "electronics", 26000, "Good"],
  ["Sony WH-1000XM4 Headphones", "electronics", 14500, "Like New"],
  ["Gaming PC Ryzen 5 + RTX 3060", "electronics", 58000, "Good"],
  ["Apple iPad 9th Gen 64GB", "electronics", 19500, "Like New"],
  ["LG 7kg Front Load Washing Machine", "home-garden", 14000, "Good"],
  ["Godrej 190L Refrigerator", "home-garden", 9500, "Fair"],
  ["Voltas 1.5 Ton Split AC", "home-garden", 18500, "Good"],
  ["Prestige Mixer Grinder 750W", "home-garden", 2200, "Like New"],
  ["Wooden Study Table", "furniture", 3500, "Good"],
  ["3-Seater Fabric Sofa Set", "furniture", 16500, "Good"],
  ["Queen Size Bed with Storage", "furniture", 21000, "Like New"],
  ["Ergonomic Office Chair", "furniture", 5800, "Good"],
  ["4-Door Steel Wardrobe", "furniture", 8900, "Fair"],
  ["Solid Wood Dining Table (6 seat)", "furniture", 24000, "Good"],
  ["Nike Air Zoom Pegasus 39", "fashion", 4200, "Like New"],
  ["Levi's 511 Slim Jeans", "fashion", 1350, "Good"],
  ["Titan Analog Wrist Watch", "fashion", 2800, "Like New"],
  ["Wildcraft 45L Trekking Backpack", "fashion", 1650, "Good"],
  ["Ray-Ban Aviator Sunglasses", "fashion", 3900, "Good"],
  ["Mountain Bicycle 21-Speed", "sports-hobbies", 8500, "Good"],
  ["Yonex Badminton Racket Pair", "sports-hobbies", 2400, "Like New"],
  ["Adjustable Dumbbell Set 20kg", "sports-hobbies", 3600, "Good"],
  ["Yamaha F310 Acoustic Guitar", "sports-hobbies", 7200, "Like New"],
  ["Treadmill (Motorised, Foldable)", "sports-hobbies", 19000, "Fair"],
  ["GATE 2026 Preparation Book Set", "books-education", 1800, "Good"],
  ["NCERT Class 12 Complete Set", "books-education", 950, "Good"],
  ["Engineering Drawing Kit", "books-education", 650, "Like New"],
  ["UPSC Prelims Study Material", "books-education", 2400, "Good"],
  ["Labrador Puppy (2 months)", "pets", 12000, "New"],
  ["Persian Cat with Vaccination", "pets", 9000, "New"],
  ["Large Bird Cage with Stand", "pets", 2600, "Good"],
  ["Aquarium 3ft with Filter", "pets", 4800, "Good"],
  ["Full Stack Developer (Fresher)", "jobs", 0, "New"],
  ["Delivery Partner — Flexible Hours", "jobs", 0, "New"],
  ["Data Entry Operator (Part Time)", "jobs", 0, "New"],
  ["AC Service & Repair", "services", 599, "New"],
  ["Home Deep Cleaning", "services", 2499, "New"],
  ["Maths Tuition (Class 9–12)", "services", 1500, "New"],
  ["Packers and Movers", "services", 4500, "New"],
  ["Acoustic Wall Panels (set of 12)", "other", 1900, "Good"],
  ["Camping Tent 4-Person", "other", 3200, "Like New"],
  ["Sewing Machine (Manual)", "other", 4100, "Fair"],
];

/** Description templates, so the copy suits the kind of thing being sold. */
const DESCRIPTIONS: Record<string, string> = {
  mobiles:
    "Single owner, no repairs, no scratches on the display. Original box, charger and bill included. Battery health still strong. Selling because I have upgraded.",
  cars:
    "Well maintained, all services done at the authorised centre with records available. Insurance valid, papers clear, single owner. Serious buyers only please.",
  bikes:
    "Regularly serviced and never involved in an accident. Tyres and battery replaced recently. All documents up to date and transfer will be handled properly.",
  electronics:
    "Working perfectly with no issues. Lightly used and kept in good condition. Original accessories included. Happy to demonstrate before you buy.",
  furniture:
    "Sturdy and in good shape with only minor signs of use. Dismantling is straightforward. Buyer to arrange pickup — I can help load it.",
  fashion:
    "Genuine article, worn only a handful of times. No damage or stains. Stored carefully. Selling as it no longer fits me.",
  "home-garden":
    "In regular working order, recently serviced. Small cosmetic marks from normal use but nothing affecting performance. Pickup from my address.",
  "books-education":
    "All pages intact with no tearing and very little highlighting. Complete set, nothing missing. Ideal for anyone starting preparation this year.",
  jobs:
    "We are hiring for an immediate opening. Training provided for the right candidate. Please reach out with a short introduction and your availability.",
  services:
    "Experienced and fully equipped, serving the area for several years. Transparent pricing with no hidden charges. Same-day slots usually available.",
  "sports-hobbies":
    "Barely used and in excellent working condition. Everything shown is included. Great for a beginner who does not want to pay full retail.",
  pets:
    "Healthy, active and well socialised. Vaccinations up to date with papers available. Looking for a genuinely caring home only.",
  other:
    "In good usable condition. Please message me for any additional photos or details and I will send them across.",
};

const labelFor = (slug: string) =>
  CATEGORIES.find((entry) => entry.slug === slug)?.label ?? "Other";

/** Fixed "now" so relative dates in the mock data do not drift while browsing. */
const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

function buildListing(
  [title, category, price, condition]: [string, string, number, Condition],
  index: number,
): Listing {
  const id = `l-${index + 1}`;
  const place = pick(CITIES, id, "city");
  const seedHash = hash(id);

  // Spread across the last ~45 days, with the first few rows very recent so the
  // homepage always has something posted "today".
  const daysAgo = index < 4 ? index : (seedHash % 45) + 1;

  const photoCount = 3 + (seedHash % 4);
  const label = labelFor(category);

  return {
    id,
    title,
    description: DESCRIPTIONS[category] ?? DESCRIPTIONS.other,
    price,
    category,
    categoryLabel: label,
    condition,
    location: pick(place.areas, id, "area"),
    city: place.city,
    image: placeholderImage(label, `${id}-0`),
    images: Array.from({ length: photoCount }, (_, photo) =>
      placeholderImage(label, `${id}-${photo}`),
    ),
    seller: {
      name: pick(SELLER_NAMES, id, "seller"),
      memberSince: `${2019 + (seedHash % 6)}`,
      phoneMasked: `+91 98${String(seedHash % 100).padStart(2, "0")}•••••`,
    },
    postedAt: new Date(NOW - daysAgo * DAY).toISOString(),
    views: 20 + (seedHash % 900),
    status: "active",
  };
}

export const LISTINGS: Listing[] = SEED_ROWS.map(buildListing);

/**
 * The signed-in seller's own listings, for the dashboard.
 *
 * Statuses are assigned here rather than mixed into LISTINGS because a sold or
 * expired listing must not appear in search results (§4B of the brief), and
 * keeping them separate makes that impossible to get wrong by accident.
 */
export const MY_LISTINGS: Listing[] = [
  { ...LISTINGS[0], id: "mine-1", views: 412, status: "active" },
  { ...LISTINGS[24], id: "mine-2", views: 233, status: "active" },
  { ...LISTINGS[30], id: "mine-3", views: 158, status: "sold" },
  { ...LISTINGS[15], id: "mine-4", views: 96, status: "expired" },
];

/** How long a listing stays live before it drops out of search. */
export const LISTING_LIFETIME_DAYS = 45;

/** Turns a timestamp into "2 days ago" for listing cards. */
export function relativeTime(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  const days = Math.floor(elapsed / DAY);

  if (days <= 0) {
    const hours = Math.floor(elapsed / (60 * 60 * 1000));
    if (hours <= 0) return "Just now";
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/** Expiry date shown on the seller dashboard. */
export function expiryDate(iso: string): string {
  const expires = new Date(
    new Date(iso).getTime() + LISTING_LIFETIME_DAYS * DAY,
  );
  return expires.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** ₹48,000 — no decimals, since no listing is priced in paise. */
export function formatPrice(price: number): string {
  if (price === 0) return "Contact for details";
  return `₹${price.toLocaleString("en-IN")}`;
}

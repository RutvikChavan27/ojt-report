/**
 * Turns marketplace listing rows into the shapes the API returns.
 *
 * Prices arrive from pg as strings (NUMERIC has no lossless JS number) and are
 * converted once here so the frontend never has to think about it.
 */
import {
  countAllListings,
  countListings,
  findCategoriesWithCounts,
  findListingById,
  findListings,
} from "../repositories/marketplace.repository";
import { resolveImagePath } from "../utils/images";
import type {
  DashboardDTO,
  ListingCategoryDTO,
  ListingDetailDTO,
  ListingDTO,
  ListingPageDTO,
} from "../types/dto";

/** How many recent listings the homepage grid shows. */
const DASHBOARD_RECENT_LIMIT = 10;

const PLACEHOLDER_IMAGE = "/images/product-slim-fit-tee.jpg";

/** A listing with no photo rows still needs something to render. */
const imageOrPlaceholder = (path: string | null): string =>
  resolveImagePath(path ?? PLACEHOLDER_IMAGE);

/**
 * Hides all but the last two digits of a phone number.
 *
 * The full number is never put in a response — this is the only form that
 * leaves the server, so a listing page cannot leak a seller's number to
 * everyone who opens it. Revealing the rest is a deliberate, separate action
 * and needs an endpoint of its own when that is built.
 */
function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return null;
  return `${"•".repeat(Math.max(digits.length - 2, 2))}${digits.slice(-2)}`;
}

/**
 * One page of active listings plus the total, so the UI can show "N results"
 * and know whether another page exists.
 *
 * `limit` is clamped to 60 so a hand-edited query string cannot ask for the
 * whole table in one response.
 */
export async function listListings(options: {
  categorySlug?: string;
  audience?: string;
  page: number;
  perPage: number;
}): Promise<ListingPageDTO> {
  const perPage = Math.min(Math.max(options.perPage, 1), 60);
  const page = Math.max(options.page, 1);

  const [rows, total] = await Promise.all([
    findListings({
      categorySlug: options.categorySlug,
      audience: options.audience,
      limit: perPage,
      offset: (page - 1) * perPage,
    }),
    countListings({
      categorySlug: options.categorySlug,
      audience: options.audience,
    }),
  ]);

  const items: ListingDTO[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category_slug,
    categoryLabel: row.category_label,
    audience: row.audience,
    brand: row.brand,
    size: row.size,
    colour: row.colour,
    condition: row.condition,
    price: Number(row.price),
    city: row.city,
    location: row.location,
    postedAt: row.posted_at.toISOString(),
    image: imageOrPlaceholder(row.image),
  }));

  return {
    items,
    total,
    page,
    perPage,
    hasMore: page * perPage < total,
  };
}

/** A single listing with all of its photos, or null when the id is unknown. */
export async function getListing(id: string): Promise<ListingDetailDTO | null> {
  const row = await findListingById(id);
  if (!row) return null;

  const images = row.images.length > 0 ? row.images : [PLACEHOLDER_IMAGE];

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category_slug,
    categoryLabel: row.category_label,
    audience: row.audience,
    brand: row.brand,
    size: row.size,
    colour: row.colour,
    condition: row.condition,
    price: Number(row.price),
    city: row.city,
    location: row.location,
    postedAt: row.posted_at.toISOString(),
    image: imageOrPlaceholder(row.image),
    images: images.map(resolveImagePath),
    seller: {
      name: row.seller_name,
      memberSince: row.seller_created_at.toISOString(),
      phoneMasked: maskPhone(row.seller_phone),
    },
    viewCount: row.view_count,
    status: row.status,
  };
}

/**
 * The homepage payload.
 *
 * Composed from the same two functions the dedicated endpoints use rather than
 * given its own queries, so the homepage can never disagree with /api/listings
 * or /api/listing-categories about what is on the site.
 *
 * `totalActive` is the count that comes back with the first page, so counting
 * costs nothing extra here.
 */
export async function getDashboard(): Promise<DashboardDTO> {
  const [recent, categories, totalListings] = await Promise.all([
    listListings({ page: 1, perPage: DASHBOARD_RECENT_LIMIT }),
    listListingCategories(),
    countAllListings(),
  ]);

  return {
    totalActive: recent.total,
    totalListings,
    recent: recent.items,
    categories,
  };
}

/** Browsable categories with live listing counts. */
export async function listListingCategories(
  audience?: string,
): Promise<ListingCategoryDTO[]> {
  const rows = await findCategoriesWithCounts(audience);
  return rows.map((row) => ({
    slug: row.slug,
    label: row.label,
    audience: row.audience,
    total: row.total,
    image: imageOrPlaceholder(row.image),
  }));
}

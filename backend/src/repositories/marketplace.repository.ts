/**
 * Data access for marketplace listings (the 100k-row searchable table).
 *
 * Kept separate from listing.repository.ts, which serves the fixed storefront
 * catalogue — different table, different lifecycle.
 */
import { query } from "../config/database";

export type ListingRow = {
  id: string;
  title: string;
  category_slug: string;
  category_label: string;
  audience: "Men" | "Women" | "Unisex";
  brand: string | null;
  size: string | null;
  colour: string | null;
  condition: string;
  price: string;
  city: string;
  posted_at: Date;
  image: string | null;
};

export type ListingDetailRow = ListingRow & {
  description: string;
  images: string[];
  seller_name: string;
  view_count: number;
};

export type FindListingsOptions = {
  categorySlug?: string;
  audience?: string;
  limit: number;
  offset: number;
};

/**
 * Columns shared by the list and detail queries. The primary photo comes from a
 * LATERAL subquery rather than a second round trip per row, so rendering a page
 * of results costs one query regardless of how many rows it holds.
 */
const LIST_SELECT = `
  SELECT
    l.id::text,
    l.title,
    l.category_slug,
    c.label AS category_label,
    l.audience,
    l.brand,
    l.size,
    l.colour,
    l.condition::text,
    l.price,
    l.city,
    l.posted_at,
    photo.path AS image
  FROM listings l
  JOIN listing_categories c ON c.slug = l.category_slug
  LEFT JOIN LATERAL (
    SELECT path
    FROM listing_photos
    WHERE listing_id = l.id
    ORDER BY is_primary DESC, position ASC
    LIMIT 1
  ) AS photo ON true
`;

/**
 * Active listings, newest first, optionally narrowed by category and audience.
 * Both filters are pushed into SQL — nothing is filtered in Node.
 *
 * Returns at most `limit` rows starting at `offset`. Offset paging is fine for
 * browsing the first few pages of a category; deep pagination needs the cursor
 * approach and is handled separately.
 */
export async function findListings(
  options: FindListingsOptions,
): Promise<ListingRow[]> {
  const { rows } = await query<ListingRow>(
    `${LIST_SELECT}
     WHERE l.status = 'active'
       AND ($1::text IS NULL OR l.category_slug = $1)
       AND ($2::listing_audience IS NULL OR l.audience = $2)
     ORDER BY l.posted_at DESC, l.id DESC
     LIMIT $3 OFFSET $4`,
    [
      options.categorySlug ?? null,
      options.audience ?? null,
      options.limit,
      options.offset,
    ],
  );
  return rows;
}

/** Total active listings matching the same filters, for "N results" and paging. */
export async function countListings(options: {
  categorySlug?: string;
  audience?: string;
}): Promise<number> {
  const { rows } = await query<{ total: string }>(
    `SELECT count(*)::text AS total
     FROM listings l
     WHERE l.status = 'active'
       AND ($1::text IS NULL OR l.category_slug = $1)
       AND ($2::listing_audience IS NULL OR l.audience = $2)`,
    [options.categorySlug ?? null, options.audience ?? null],
  );
  return Number(rows[0]?.total ?? 0);
}

/**
 * One listing with every photo and its seller's name. Returns null when the id
 * does not exist; sold and expired listings are still reachable by direct link,
 * which is why status is not filtered here.
 */
export async function findListingById(
  id: string,
): Promise<ListingDetailRow | null> {
  const { rows } = await query<ListingDetailRow>(
    `SELECT
       l.id::text,
       l.title,
       l.description,
       l.category_slug,
       c.label AS category_label,
       l.audience,
       l.brand,
       l.size,
       l.colour,
       l.condition::text,
       l.price,
       l.city,
       l.posted_at,
       l.view_count,
       u.display_name AS seller_name,
       COALESCE(
         (
           SELECT array_agg(path ORDER BY is_primary DESC, position ASC)
           FROM listing_photos
           WHERE listing_id = l.id
         ),
         '{}'
       ) AS images,
       (
         SELECT path
         FROM listing_photos
         WHERE listing_id = l.id
         ORDER BY is_primary DESC, position ASC
         LIMIT 1
       ) AS image
     FROM listings l
     JOIN listing_categories c ON c.slug = l.category_slug
     JOIN users u ON u.id = l.seller_id
     WHERE l.id = $1::bigint`,
    [id],
  );
  return rows[0] ?? null;
}

/** Categories with how many active listings each currently holds. */
export async function findCategoriesWithCounts(audience?: string): Promise<
  { slug: string; label: string; audience: string; total: number; image: string | null }[]
> {
  const { rows } = await query<{
    slug: string;
    label: string;
    audience: string;
    total: string;
    image: string | null;
  }>(
    `SELECT
       c.slug,
       c.label,
       c.audience::text,
       count(l.id)::text AS total,
       (
         SELECT p.path
         FROM listings l2
         JOIN listing_photos p ON p.listing_id = l2.id AND p.is_primary
         WHERE l2.category_slug = c.slug AND l2.status = 'active'
         LIMIT 1
       ) AS image
     FROM listing_categories c
     LEFT JOIN listings l
       ON l.category_slug = c.slug AND l.status = 'active'
     WHERE ($1::listing_audience IS NULL OR c.audience = $1)
     GROUP BY c.slug, c.label, c.audience, c."order"
     ORDER BY c."order" ASC`,
    [audience ?? null],
  );

  return rows.map((row) => ({
    slug: row.slug,
    label: row.label,
    audience: row.audience,
    total: Number(row.total),
    image: row.image,
  }));
}

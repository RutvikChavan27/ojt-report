/**
 * Full-text search over products.search_vector (see db/schema.sql), ranked
 * with ts_rank and optionally narrowed by gender. Parses natural queries
 * ("denim jacket", quoted phrases, -exclusions) via websearch_to_tsquery.
 */
export const SEARCH_PRODUCTS_SQL = `
  SELECT
    slug, name, category, price, original_price, rating, image, brand, color,
    variant_count, gender,
    ts_rank(search_vector, websearch_to_tsquery('english', $1)) AS rank
  FROM products
  WHERE search_vector @@ websearch_to_tsquery('english', $1)
    AND ($2::gender IS NULL OR gender = $2::gender)
  ORDER BY rank DESC, "order" ASC
  LIMIT 24
`;

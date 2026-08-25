-- Marketplace schema for Bazaar: a second-hand clothing marketplace.
-- Idempotent, so it is safe to re-run alongside the storefront schema.
--
-- Every index at the bottom of this file carries a comment naming the query it
-- exists for; anything that cannot be justified that way should not be here.

CREATE EXTENSION IF NOT EXISTS pg_trgm; -- trigram similarity, for typo tolerance
CREATE EXTENSION IF NOT EXISTS citext; -- case-insensitive email comparison

-- pg_trgm ships with word_similarity_threshold at 0.6, which is too strict for
-- ordinary misspellings: measured against this data, "hoodei" -> "Hoodie"
-- scores 0.571, "jaket" -> "Jacket" 0.444 and "swaeter" -> "Sweater" 0.333.
-- 0.3 accepted all of those, but missed the classifieds category itself:
-- "bycicle" -> a "Bicycle" listing title scores only 0.25 (the titles here are
-- full phrases like "Kids Bicycle 20-inch — Barely Used", which dilutes the
-- single-word match), so it was silently rejected. 0.2 accepts that too, with
-- headroom for the same effect on other multi-word titles.
--
-- The cost is recall traded for precision: a looser threshold matches more
-- unrelated words, which is why the fuzzy path only runs after the exact search
-- has already returned nothing.
DO $$
BEGIN
  -- Touch a pg_trgm function first so its GUCs are registered in this session,
  -- otherwise ALTER DATABASE rejects the parameter as unrecognised.
  PERFORM word_similarity('a', 'b');
  EXECUTE format(
    'ALTER DATABASE %I SET pg_trgm.word_similarity_threshold = 0.2',
    current_database()
  );
END $$;

-- One account system. password_hash is nullable because an OAuth-only account
-- has no local password; such a user can still add one later.
--
-- There is no buyer/seller distinction here on purpose: "seller" is not a kind
-- of account, it is a relationship to a row — the user a listing's seller_id
-- points at. Anyone signed in may post, and owning a listing is what grants the
-- right to edit or delete it.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drops the short-lived account_type experiment. Idempotent, like everything
-- else here, so `npm run migrate` stays safe to re-run; the constraint goes
-- with the column automatically.
ALTER TABLE users DROP COLUMN IF EXISTS account_type;

-- Contact number for a seller, and nullable on purpose.
--
-- Nothing collects it yet, so every existing row is NULL and the API reports no
-- phone rather than a placeholder. Only a masked form is ever sent to a client
-- (see maskPhone in marketplace.service) — the full number is not part of any
-- response shape.
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- A social login. Kept in its own table so one user can link several providers,
-- which is how a Google sign-in matching an existing email resolves to one user
-- rather than creating a duplicate account.
CREATE TABLE IF NOT EXISTS oauth_identities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);

DO $$ BEGIN
  CREATE TYPE listing_condition AS ENUM (
    'New with tags', 'Like new', 'Good', 'Fair'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('active', 'sold', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_audience AS ENUM ('Men', 'Women', 'Unisex');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Browsable garment categories (Shirts, Dresses, ...). Slug is the public id.
CREATE TABLE IF NOT EXISTS listing_categories (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  audience listing_audience NOT NULL DEFAULT 'Unisex',
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Subcategories are a browsing convenience layered on the same table: a row
-- with parent_slug set is a child of that main category. The main category
-- remains the one a listing must have; subcategory_slug on listings is
-- nullable, so nothing depends on a listing having been filed that finely.
ALTER TABLE listing_categories
  ADD COLUMN IF NOT EXISTS parent_slug TEXT REFERENCES listing_categories (slug) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS listing_categories_parent_idx
  ON listing_categories (parent_slug, "order");

CREATE TABLE IF NOT EXISTS listings (
  id BIGSERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_slug TEXT NOT NULL REFERENCES listing_categories (slug),
  subcategory_slug TEXT REFERENCES listing_categories (slug),
  audience listing_audience NOT NULL,
  brand TEXT,
  size TEXT,
  colour TEXT,
  condition listing_condition NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  city TEXT NOT NULL,
  status listing_status NOT NULL DEFAULT 'active',
  view_count INTEGER NOT NULL DEFAULT 0,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  sold_at TIMESTAMPTZ,
  -- A word in the title must outrank the same word in a description, so the
  -- title is weighted 'A' and the body 'B'. Brand/colour sit lower again: they
  -- should match, but a brand mention shouldn't beat a real title hit. This is
  -- a plain full-text search over the listing's own words — no synonyms or
  -- keyword expansion; a search for "laptop" matches listings whose title or
  -- description actually contains "laptop", which is why the titles carry the
  -- item type (see the seed).
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(colour, '')), 'D')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Photos live on disk; only their paths are stored here. Capped at eight per
-- listing by the API, with exactly one primary enforced by the index below.
CREATE TABLE IF NOT EXISTS listing_photos (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  thumb_path TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0
);

-- A named search plus the filters it was saved with. last_viewed_at is what
-- "how many new listings since you last looked" is measured against, and
-- seen_count is the result total captured at that moment — the badge is
-- (current total − seen_count). Storing it on the row, not per-browser, is what
-- makes the count survive a login from a different browser or device.
CREATE TABLE IF NOT EXISTS saved_searches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL DEFAULT '',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  seen_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Existing databases predate seen_count; add it in place so a re-run of this
-- file on an already-migrated database picks it up rather than silently lacking
-- the column the saved-search endpoints write to.
ALTER TABLE saved_searches
  ADD COLUMN IF NOT EXISTS seen_count INTEGER NOT NULL DEFAULT 0;

-- Listings a user has saved (the wishlist). A join row per (user, listing), so
-- ownership is the primary key itself — a user can only ever read or delete
-- their own rows, and saving the same listing twice is a no-op rather than a
-- duplicate. The listing itself is never copied; only its id is kept, so a saved
-- listing always reflects the seller's current price and status.
CREATE TABLE IF NOT EXISTS saved_listings (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  listing_id BIGINT NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

-- Newest-first listing of a user's saved items, and the lookup behind the
-- wishlist page and the heart's saved/not-saved state.
CREATE INDEX IF NOT EXISTS saved_listings_user_idx
  ON saved_listings (user_id, created_at DESC);

-- === Indexes ===============================================================

-- Full-text search itself. GIN is the right structure for tsvector @@ tsquery.
CREATE INDEX IF NOT EXISTS listings_search_vector_idx
  ON listings USING GIN (search_vector);

-- Typo tolerance: "bycicle" never produces a tsquery lexeme that matches
-- "bicycle", so trigram similarity on the raw title backs up the FTS path.
CREATE INDEX IF NOT EXISTS listings_title_trgm_idx
  ON listings USING GIN (title gin_trgm_ops);

-- Default browse and the "newest first" sort, which is also the keyset
-- pagination path: (posted_at DESC, id DESC) is the cursor tuple, and status
-- leads because sold/expired rows are excluded from search by default.
CREATE INDEX IF NOT EXISTS listings_status_posted_idx
  ON listings (status, posted_at DESC, id DESC);

-- Price sorts, again with id as the tiebreaker so the cursor is unambiguous.
CREATE INDEX IF NOT EXISTS listings_status_price_idx
  ON listings (status, price, id);

-- Category and city are the two most selective facets; these let a filtered
-- browse skip the full active set instead of scanning it.
CREATE INDEX IF NOT EXISTS listings_status_category_posted_idx
  ON listings (status, category_slug, posted_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS listings_status_city_posted_idx
  ON listings (status, city, posted_at DESC, id DESC);

-- Facet counts. Every filter list needs a count over all active listings, so
-- there is no selective predicate to exploit — roughly 70% of the table
-- qualifies and an ordinary index would be ignored in favour of a seq scan.
--
-- What this index does instead is make that scan cheaper: it holds the six
-- faceted columns plus price (as INCLUDE — a payload column, not part of the
-- key), so the whole active set can be read index-only without touching a
-- heap whose rows also carry title, description and the tsvector. Price is
-- INCLUDEd rather than added as a key column because the facet query needs
-- its value (to bucket into a price band) but never filters or sorts by it
-- here — a key column would just bloat the b-tree for no benefit.
--
-- Price's absence was a real bug, not a simplification: without it, the
-- query still had to visit the heap for every one of the ~90k active rows to
-- read price, which made the planner prefer a plain sequential scan over the
-- "index-only" scan entirely — measured at 500ms+ on the unfiltered facet
-- query once the table passed 100k rows, versus ~40ms with price included.
--
-- Partial on status='active' so no space is spent on sold or expired rows.
-- Requires the visibility map to be current to be used index-only, which is
-- why listings is vacuumed after seeding.
DROP INDEX IF EXISTS listings_facets_idx;
CREATE INDEX IF NOT EXISTS listings_facets_idx
  ON listings (category_slug, audience, city, condition, size, colour)
  INCLUDE (price)
  WHERE status = 'active';

-- Expiry sweep: find active listings whose expires_at has passed.
CREATE INDEX IF NOT EXISTS listings_expires_at_idx
  ON listings (expires_at) WHERE status = 'active';

-- The seller dashboard lists one seller's own items, newest first.
CREATE INDEX IF NOT EXISTS listings_seller_posted_idx
  ON listings (seller_id, posted_at DESC);

-- Fetching a result page's photos in one round trip (avoids N+1).
CREATE INDEX IF NOT EXISTS listing_photos_listing_idx
  ON listing_photos (listing_id, position);

-- At most one primary photo per listing.
CREATE UNIQUE INDEX IF NOT EXISTS listing_photos_one_primary_idx
  ON listing_photos (listing_id) WHERE is_primary;

CREATE INDEX IF NOT EXISTS saved_searches_user_idx
  ON saved_searches (user_id, created_at DESC);

-- Neighbourhood or area within `city`, e.g. "Bandra" for a Mumbai listing.
--
-- Nullable and deliberately not backfilled: the seed data has city-level
-- information only, and inventing a neighbourhood for 100,000 rows would put
-- fabricated addresses in front of buyers. The API returns null and the UI
-- falls back to showing the city alone; the Post Ad form is where real values
-- will start arriving.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location TEXT;


-- Older databases predate the subcategory column on listings.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS subcategory_slug TEXT REFERENCES listing_categories (slug);

CREATE INDEX IF NOT EXISTS listings_subcategory_idx
  ON listings (subcategory_slug) WHERE status = 'active';

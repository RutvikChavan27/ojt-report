-- Marketplace schema for Bazaar: a second-hand clothing marketplace.
-- Idempotent, so it is safe to re-run alongside the storefront schema.
--
-- Every index at the bottom of this file carries a comment naming the query it
-- exists for; anything that cannot be justified that way should not be here.

CREATE EXTENSION IF NOT EXISTS pg_trgm; -- trigram similarity, for typo tolerance
CREATE EXTENSION IF NOT EXISTS citext; -- case-insensitive email comparison

-- Sellers/buyers. password_hash is nullable because an OAuth-only account has
-- no local password; such a user can still add one later.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS listings (
  id BIGSERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_slug TEXT NOT NULL REFERENCES listing_categories (slug),
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
  -- should match, but a brand mention shouldn't beat a real title hit.
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
-- "how many new listings since you last looked" is measured against.
CREATE TABLE IF NOT EXISTS saved_searches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL DEFAULT '',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

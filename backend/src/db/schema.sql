-- Idempotent schema for the Thread store API (safe to re-run).

DO $$ BEGIN
  CREATE TYPE gender AS ENUM ('Men', 'Women');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2) NOT NULL,
  rating NUMERIC(2, 1) NOT NULL,
  image TEXT NOT NULL,
  brand TEXT NOT NULL,
  color TEXT NOT NULL,
  variant_count INTEGER,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  gender gender NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(color, '')), 'D')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS products_gender_order_idx ON products (gender, "order");
CREATE INDEX IF NOT EXISTS products_search_vector_idx ON products USING GIN (search_vector);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  image TEXT NOT NULL,
  gender gender NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_gender_order_idx ON categories (gender, "order");

CREATE TABLE IF NOT EXISTS hero_looks (
  id SERIAL PRIMARY KEY,
  src TEXT NOT NULL,
  alt TEXT NOT NULL,
  gender gender NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hero_looks_gender_order_idx ON hero_looks (gender, "order");

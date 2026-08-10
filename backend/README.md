# Thread Store API (Express + PostgreSQL)

Backend that serves the storefront's Dashboard data (products, category tiles,
hero looks) from a local PostgreSQL database, plus the listing images from disk.

## Prerequisites
- Node 20+
- A local PostgreSQL server running at `127.0.0.1:5432` (the DB `thread` is
  created automatically by `npm run migrate`). Install PostgreSQL, or run it
  via Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres --name postgres postgres:17`

## Setup
```bash
cd backend
cp .env.example .env      # adjust DATABASE_URL if your Postgres credentials differ
npm install
npm run migrate           # creates the "thread" database and applies schema.sql
npm run seed               # loads products, categories and hero looks into Postgres
npm run dev                 # starts the API on http://localhost:5000 (watch mode)
```

## Images
Product/category/hero images live on disk under `backend/uploads/images` and are
served at `/images/<file>`. The DB stores the relative path (e.g.
`/images/product-slim-fit-tee.jpg`); the frontend prepends the API base URL.
To add or replace an image, drop the file in `uploads/images` and reference
`/images/<file>` in the seed.

## Full-text search
`products.search_vector` is a generated `tsvector` column (name/category/brand/color,
weighted) with a GIN index (see `src/db/schema.sql`). `GET /api/search` ranks matches
with `ts_rank` over `websearch_to_tsquery`, so natural queries like `"denim jacket"` or
`-hoodie` work as expected.

## Endpoints
| Method | Path                          | Description                          |
|--------|-------------------------------|---------------------------------------|
| GET    | `/health`                     | Liveness check                       |
| GET    | `/api/products?gender=Men`    | Products (gender optional)           |
| GET    | `/api/categories?gender=Men`  | "Shop by category" tiles             |
| GET    | `/api/hero-looks?gender=Men`  | Hero lookbook images                 |
| GET    | `/api/dashboard?gender=Men`   | All three at once, for the home page |
| GET    | `/api/search?q=denim&gender=Men` | Full-text product search, ranked by relevance |

`gender` accepts `Men` or `Women` (case-insensitive); omit or send an invalid
value to get all rows. Responses use the envelope `{ "success": true, "data": ... }`.

## Scripts
- `npm run dev` — start with hot reload (tsx watch)
- `npm start` — start once
- `npm run migrate` — create the database (if missing) and apply `src/db/schema.sql`
- `npm run seed` — (re)seed the database
- `npm run typecheck` — TypeScript check, no emit

# Thread Store API (Express + MongoDB)

Backend that serves the storefront's Dashboard data (products, category tiles,
hero looks) from a local MongoDB, plus the listing images from disk.

## Prerequisites
- Node 20+
- A local MongoDB running at `mongodb://127.0.0.1:27017` (the DB `thread` is
  created automatically). Install MongoDB Community Server, or run it via Docker:
  `docker run -d -p 27017:27017 --name mongo mongo:7`

## Setup
```bash
cd backend
cp .env.example .env      # already present; adjust if needed
npm install
npm run seed              # loads products, categories and hero looks into MongoDB
npm run dev               # starts the API on http://localhost:5000 (watch mode)
```

## Images
Product/category/hero images live on disk under `backend/uploads/images` and are
served at `/images/<file>`. The DB stores the relative path (e.g.
`/images/product-slim-fit-tee.jpg`); the frontend prepends the API base URL.
To add or replace an image, drop the file in `uploads/images` and reference
`/images/<file>` in the seed.

## Endpoints
| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/health`                     | Liveness check                       |
| GET    | `/api/products?gender=Men`    | Products (gender optional)           |
| GET    | `/api/categories?gender=Men`  | "Shop by category" tiles             |
| GET    | `/api/hero-looks?gender=Men`  | Hero lookbook images                 |
| GET    | `/api/dashboard?gender=Men`   | All three at once, for the home page |

`gender` accepts `Men` or `Women` (case-insensitive); omit or send an invalid
value to get all rows. Responses use the envelope `{ "success": true, "data": ... }`.

## Scripts
- `npm run dev` — start with hot reload (tsx watch)
- `npm start` — start once
- `npm run seed` — (re)seed the database
- `npm run typecheck` — TypeScript check, no emit

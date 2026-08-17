# Bazaar — working notes for Claude

## Read BRIEF.md first

[`BRIEF.md`](BRIEF.md) is the distilled version of the assessed project brief
(`Devnco-Project-Brief-05-Marketplace-Search.docx`), with every requirement traced to its section
number and a current status.

Before starting any piece of work, and again before reporting it done:

1. Check the change against BRIEF.md.
2. If it advances a requirement, note which one.
3. **If it appears in §7 "out of scope", say so before building it.** The brief's wording is "Do not
   build these, even if you have time", and §10 grades scope discipline. Payments and checkout,
   messaging, map/radius search, recommendations, admin tooling, real email/SMS, ratings and a mobile
   app are all forbidden.
4. If the work is neither in the brief nor forbidden, say that too — the storefront half of this
   repo (products, cart, wishlist, lookbook) is in that category.
5. Update the status line in BRIEF.md when something changes state.

Priorities come from §10 of the brief, not from what is most fun to build: measured performance at
100k rows first, then index justification, then facet-count correctness, then pagination stability.

## Project shape

- `backend/` — Express 5 + `pg`, Postgres 17. No ORM; SQL lives in `src/db/queries/*.sql.ts`.
- `frontend/` — React 19 + Vite + Tailwind v4. No router yet (which is why §4C's "search state in
  the URL" is unbuilt).
- Search: Postgres full-text only — `tsvector` with weighted `setweight`, plus `pg_trgm` for typo
  tolerance. External search engines are forbidden by §3.

## Conventions already established here

- Every file opens with a comment saying what it is for; exported functions document inputs, output
  and failure modes; non-obvious logic explains *why*. This is a graded requirement (§5), not a
  style preference.
- Filter values are always bind parameters. Only self-authored fragments are ever concatenated into
  SQL — the search box is treated as an injection vector because §5 says it will be tested as one.
- Indexes must be justified by a named query in a comment. "An index you cannot justify should not
  be in the schema."

## Commands

```bash
cd backend  && npm run dev              # API on :5000
cd frontend && npm run dev              # SPA on :5173
cd backend  && npm run seed:listings    # 100k listings, ~25s
cd backend  && npm run explain:facets   # facet query plans + timings
cd backend  && npm run typecheck
cd frontend && npm run build
```

There is no test runner installed yet; §7 requires one.

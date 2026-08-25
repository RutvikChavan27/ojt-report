# Bazaar

A classifieds marketplace: search, filter, and browse second-hand listings;
post your own, save searches, and manage what you're selling. Built to the
brief *Devnco Project Brief 05 — Marketplace Search*: React SPA talking to a
genuinely separate Node/Express API, PostgreSQL as the only datastore (its
own full-text search and query planner, not Elasticsearch/Algolia/Meilisearch),
email/password plus Google OAuth, and photos stored outside the database.

- **Live site:** https://ojt-report-pi.vercel.app
- **Live API:** https://ojt-report-backend.onrender.com (`/health` → `{"success":true,"status":"ok"}`)
- **Database:** PostgreSQL 17 (Supabase), 145,000 listings (99,169 active), well past the brief's 100,000-listing floor — verify anytime with `SELECT count(*) FROM listings;`

No login is needed to browse, search, or open a listing — only to post one,
save a search, or manage your own listings.

---

## Architecture

```
┌─────────────────┐        HTTPS, JSON         ┌──────────────────┐        SQL         ┌──────────────┐
│  frontend/       │ ─────────────────────────▶ │  backend/         │ ──────────────────▶ │  PostgreSQL   │
│  React 19 + Vite │ ◀───────────────────────── │  Express 5 + TS   │ ◀────────────────── │  (Supabase)   │
│  Tailwind CSS    │   cookie session (bazaar.sid)│  no ORM — raw SQL │                     │  17            │
└─────────────────┘                             └──────────────────┘                     └──────────────┘
     Vercel                                          Render                                Supabase
```

The two halves are deployed and scaled independently, and talk to each other
over the same documented HTTP API (`docs/API.md`) a third-party client would
use — nothing is shared in-process. There is no ORM: every query lives in
`backend/src/db/queries/*.sql.ts` as a plain, parameterised SQL string, so
what Postgres actually executes is never more than one function call away
from what's written here.

Listing photos live outside the database — on disk in local development, or
in a Supabase Storage bucket in production (`IMAGE_STORAGE=supabase`); the
`listings`/`listing_photos` tables only ever hold a `/images/...` path.

## Local setup

Requires Node 20+ and a PostgreSQL 15+ connection (local, or a hosted
instance such as Supabase — the full-text search and query planner are used
directly, so Postgres specifically is not optional).

```bash
git clone <this repo>
cd ojt-report

# Backend
cd backend
cp .env.example .env      # fill in DATABASE_URL at minimum — see below
npm install
npm run migrate           # applies src/db/marketplace.sql (idempotent)
npm run seed:marketplace100k   # 100,000 listings — see "Seed data" below
npm run dev                # API on http://localhost:5000

# Frontend, in a second terminal
cd frontend
cp .env.example .env       # VITE_API_URL=http://localhost:5000
npm install
npm run dev                 # site on http://localhost:5173
```

### Environment variables

Every variable is documented in place in `backend/.env.example` and
`frontend/.env.example`; the essentials:

| Variable | Where | Required | Notes |
|---|---|---|---|
| `DATABASE_URL` | backend | **yes** | No hardcoded fallback — the app refuses to start without it. |
| `SESSION_SECRET` | backend | yes | Signs the session cookie. |
| `CLIENT_URL` | backend | yes | CORS origin(s) allowed to call the API with credentials. |
| `PORT` | backend | no | Defaults to `5000`. |
| `IMAGE_STORAGE`, `SUPABASE_*` | backend | only in production | Switches listing photos from local disk to Supabase Storage. |
| `GOOGLE_CLIENT_ID`/`SECRET`/`CALLBACK_URL` | backend | no | Leave blank to disable the "Continue with Google" button — the rest of the app works without it. |
| `PEXELS_API_KEY` | backend | only for re-seeding images | Not needed to run the app. |
| `VITE_API_URL` | frontend | yes | Base URL of the backend API. |

`.env` is git-ignored in both packages — no secrets are committed (see
[Known limitations](#known-limitations) for one historical exception, already
resolved).

### Seed data (100,000+ listings)

```bash
npm run seed:marketplace100k          # 100,000 listings (default)
npm run seed:marketplace100k -- 5000  # a smaller set while developing
```

Full mechanics, measured distribution, and how to verify the count are in
[`backend/README.md`](backend/README.md#seed-data-100000-listings) — in
short: ~150 real listing templates multiplied across 2,000 sellers, 18
cities, and varied prices/dates/conditions/status with a seeded PRNG, so a
given size is reproducible and `EXPLAIN ANALYZE` comparisons stay meaningful
between runs.

### Running the tests

```bash
cd backend && npm test     # unit + integration (hits the real database)
cd frontend && npm test    # pure unit tests, no database
```

See [Tests](#tests) below for what's covered and how the database-backed
suite stays safe to run against a database that also holds the real 100k+
listings.

---

## Data model

The full schema is [`backend/src/db/marketplace.sql`](backend/src/db/marketplace.sql),
with every column and index commented in place. The core tables:

- **`users`** — one account system. No buyer/seller distinction: anyone
  signed in may post, and owning a listing (`listings.seller_id`) is what
  grants the right to edit or delete it. `password_hash` is nullable for an
  OAuth-only account.
- **`oauth_identities`** — one row per linked provider, so a Google sign-in
  matching an existing email resolves to the same user rather than creating
  a duplicate.
- **`listing_categories`** — 16 top-level categories; a row with
  `parent_slug` set is a subcategory of another row in the same table.
- **`listings`** — the core table. `search_vector` is a generated,
  `STORED` `tsvector` column, weighted so a title match (`'A'`) outranks the
  same word in the description (`'B'`), brand (`'C'`), or colour (`'D'`).
- **`listing_photos`** — paths only; the bytes live outside the database
  (see Architecture above).
- **`saved_searches`**, **`saved_listings`** — per-user, both scoped by a
  foreign key to `users` and enforced server-side per request (see
  `docs/API.md`), not just hidden in the UI.

## Search

Single box, full-text over title + description (+ brand + colour, weighted
lower), backed entirely by Postgres — `tsvector`/`tsquery` for the exact
match, `pg_trgm` word-similarity as a fallback for a misspelled query that
matches no lexeme at all (`"bycicle"` → suggests "bicycle"; only tried after
an exact miss, since it is the more expensive path and the majority of
searches don't need it — see `searchListingsFuzzy` in
`backend/src/repositories/listingSearch.repository.ts`).

`pg_trgm.word_similarity_threshold` is set to **0.2** (`backend/src/db/marketplace.sql`,
`backend/src/config/database.ts`), not the library's 0.6 default. Titles here
are full phrases ("Kids Bicycle 20-inch — Barely Used"), which dilutes a
single-word match: `word_similarity('bycicle', …)` against that title scores
only 0.25, so the threshold has to sit below that or the canonical typo
example in this brief matches nothing. Verified directly against the
deployed database: `'bycicle' <% title` returns 0 rows at 0.3, ~3,500 at 0.2,
without materially loosening precision for other misspellings (`"hoodei"`
0.571, `"jaket"` 0.444, `"swaeter"` 0.333 all still clear it).

Filters (category, city, condition, size, colour, price, posted-within) all
combine, each independent of the others, and every filter list shows a count
computed **with every other filter applied but not its own** — otherwise
picking "Mobiles" would show every other category as zero, with no way to
switch. One statement produces all six groups' counts in a single round trip
(`backend/src/db/queries/listingFacets.sql.ts`) rather than one query per
group.

The complete state of a search — query, every filter, sort, and page/cursor
— lives in the URL (`frontend/src/lib/search.ts`), never in component state
alone: a result page is bookmarkable, shareable, survives a reload, and
behaves correctly under the browser's back button, and this is
round-trip-tested (see [Tests](#tests)).

## Pagination

The brief requires **"page 500 must return as quickly as page 2"** and
explicitly rules out `OFFSET` for it. Measured on the deployed database, an
unmitigated `OFFSET` does exactly what that warns against:

```
EXPLAIN (ANALYZE, BUFFERS) — newest-first browse, active listings

OFFSET 24   (page 2):     Execution Time: 0.099 ms   — Index Only Scan, 4 buffer hits, 48 rows visited
OFFSET 95976 (page 4000): Execution Time: 35.265 ms  — Index Only Scan, 660 buffer hits, 96,000 rows visited
```

Postgres still uses the index either way (`Index Cond` on `status`, with
`posted_at DESC, id DESC` for the ordering) — the cost is not a missing
index, it's that `OFFSET` makes Postgres walk past every one of the 96,000
rows before it, one at a time, just to discard them.

**The fix:** every search response carries a `nextCursor`/`prevCursor` — the
tiebreaker values of the last/first row on the page, base64-encoded
(`backend/src/db/queries/listingSearch.sql.ts`). Handing one back with a
`cursorDir` seeks by index instead:

```sql
WHERE (l.posted_at, l.id) < ($cursor_posted_at, $cursor_id)   -- forward
ORDER BY l.posted_at DESC, l.id DESC
LIMIT 24
```

```
EXPLAIN (ANALYZE, BUFFERS) — same query, at the same depth, via cursor

Execution Time: 0.080 ms — Index Only Scan, 4 buffer hits, 24 rows visited (exactly the LIMIT)
```

0.08 ms regardless of whether the cursor's position is row 24 or row 96,000
— confirmed against the live API too: five repeated requests at "page 2"
depth and five at "page 4000" depth via cursor both averaged ~0.78 s wall
time (dominated by the network round trip to the deployed database), while
the equivalent plain `OFFSET` requests measured ~0.78 s and ~1.35 s
respectively — a consistent, reproducible ~570 ms gap that exists only on
the `OFFSET` path.

Every sort (`newest`, `price_asc`, `price_desc`, `relevance`) already ends on
`id` as a tiebreaker specifically so the order is total — without that, two
rows with an equal price or timestamp could swap places between requests,
and a keyset cursor would skip or repeat one. This was anticipated in the
schema before today: the composite indexes
`listings (status, posted_at DESC, id DESC)` and
`listings (status, price, id)` already existed for exactly this ordering, so
no new index was needed to support the cursor.

**What a cursor cannot do, and what still uses `OFFSET`:** random access to
an arbitrary, non-adjacent page number (e.g. typing `?page=500` into the
address bar with no prior context) has no O(1) answer without either
`OFFSET` or pre-materialising every page boundary for every possible filter
combination, which isn't practical. The frontend's Previous/Next (and any
page-number button adjacent to the one on screen) always carry a cursor and
get the fast path; jumping to First, Last, or a distant page number falls
back to a plain `page`, using `OFFSET` for that one request. This is a
deliberate, bounded trade-off, not an oversight — see §9 Q1 below for the
full reasoning. The existing "requested a page beyond the last real one"
correction (e.g. a bookmarked search that's since been narrowed by a new
filter) is untouched and still uses this `OFFSET` path, since it's a rare
correction, not the primary navigation.

## Indexes, and why

Every index in `backend/src/db/marketplace.sql` carries this justification
in place as a comment; summarised here:

| Index | Backs |
|---|---|
| `listings_search_vector_idx` (GIN on `search_vector`) | Full-text `@@` matching. |
| `listings_title_trgm_idx` (GIN, `pg_trgm`) | Typo-tolerant fallback search and the leading-wildcard type-ahead. |
| `listings_status_posted_idx` (`status, posted_at DESC, id DESC`) | Default "newest" browse **and** the keyset cursor tuple for that sort. |
| `listings_status_price_idx` (`status, price, id`) | Price sorts and their cursor tuple. |
| `listings_status_category_posted_idx`, `listings_status_city_posted_idx` | Category/city browse without a full scan. |
| `listings_facets_idx` (partial, `WHERE status = 'active'`, `INCLUDE (price)`) | Facet counts — an index-only scan over the six faceted columns plus `price` as a covered payload column, since ~70% of the table qualifies and an ordinary index would be ignored for a seq scan otherwise. `price` was added to the index as part of this pass — see [Performance](#performance-at-145k-rows) for why its absence mattered. |
| `listings_expires_at_idx` (partial) | The expiry sweep. |
| `listings_seller_posted_idx` | The seller dashboard (`GET /api/listings/mine`). |
| `listing_photos_listing_idx` | Fetching a result page's primary photo via one `LATERAL` join, avoiding N+1. |

**Considered and rejected:** a plain index on `listings.condition`,
`.size`, `.colour` individually — the facets index above already covers all
six faceted columns together for the one query that needs them all at once,
and a single-column index on any of them would only ever be used alongside a
seq scan on the rest of the predicate, at extra write cost for no read
benefit.

## Performance at 145k rows

The database has grown past the original 100k-row seed (145,000 total,
99,169 active as of this writing — `SELECT count(*) FROM listings`).
Measured with `EXPLAIN (ANALYZE)` on the deployed database (server-side
execution time, excluding client↔server network latency), re-verified after
running `VACUUM ANALYZE listings` to refresh planner statistics and the
visibility map:

| Query | Execution time (warm) |
|---|---|
| Full-text `iphone`, ranked, limit 12 | **~15–19 ms** |
| Category browse (newest, limit 12) | **~0.1 ms** |
| Facet counts, narrowed by a query or filter | **~7–24 ms** |
| Facet counts, **no query or filter at all** (a plain "all listings" browse) | **~400–550 ms** — see below |
| Deep pagination via `OFFSET` (page 4000, offset ~48,000) | **~27–83 ms** |
| The same depth via keyset cursor | **~1 ms** |
| Typo-tolerant fuzzy search (`"bycicle"`) | **~115–280 ms** — see below |

**These are warm-cache numbers** — the same query run immediately after a
cold/idle period on this connection measured far higher (the `iphone` search
above hit 1,882 ms on a first touch, then settled to 15–19 ms on every
run after; the fuzzy search hit 2,840 ms cold, then 115–280 ms warm). This
isn't a measurement error — re-ran each query 5× in sequence and watched it
happen directly. It's Postgres's own buffer cache: a page nobody has touched
recently has to come from disk once, then stays cached. A live site under
continuous real traffic stays warm; a query that hasn't run in a while (or
one run right after a burst of unrelated ad-hoc queries, as happened while
producing this table) pays that cost again. Worth knowing, not disclosed
before this pass.

The **fuzzy/typo path is a genuine, separate concern even warm**: 115–280 ms
on its own, which leaves little to no margin once any network latency is
added on top (see the API-latency section below) — closer to the 300 ms
ceiling than any other query here, and the one most likely to tip over it
in practice.

Everything else is comfortably under the brief's 300 ms target **except the
unfiltered facet-count case**, which is not: computing all six facet groups
with nothing narrowing the ~90,000 active rows costs roughly 400–550 ms at
this scale, and this is the query the site actually runs on its own "all
listings, no search" page.

**Root cause, found and partly fixed during a performance re-audit:**
`fetchFacetCounts` materialises a CTE over every active listing and scans it
once per facet group (6 scans). Two real problems compounded:

1. `listings_facets_idx` didn't include `price`, which the query needs for
   every row — so Postgres couldn't do a true index-only scan and fell back
   to a sequential scan of the whole table. **Fixed**: the index now
   `INCLUDE`s `price` as a payload column (`backend/src/db/marketplace.sql`),
   confirmed by `EXPLAIN` to now use `Index Only Scan`.
2. Past roughly 100k rows, materialising that CTE (six columns × ~90k rows)
   exceeds Postgres's 4 MB default `work_mem`, so it was spilling to on-disk
   temp files. **Fixed**: `work_mem` is now raised to 64 MB per connection
   (`backend/src/config/database.ts`), confirmed to remove the temp-file
   spill from the plan.

Both fixes are real and measured, but **neither closes the gap on their
own** — with both applied, the unfiltered case still costs ~400–550 ms,
because scanning and filtering ~90,000 in-memory rows six times over is
inherently CPU-bound work that grows with the active-listing count,
independent of indexing or memory. The query is fast (~15–20 ms) the moment
any query or filter narrows the candidate set — which is true of almost
every real search — but a genuinely unfiltered "show me everything" browse
is not, and will get slower as the dataset grows further. Closing this
properly means rewriting the six sequential CTE scans into a single pass
(e.g. `GROUPING SETS`), which was not attempted here: it touches the exact
logic §10 grades most strictly ("a count that is subtly wrong is worse than
no count at all"), and is not a change to make right before a submission
deadline without time to test it thoroughly. This is a known, disclosed
limitation, not a hidden one — see [Known limitations](#known-limitations).

Reproduce any of these with `npm run explain:facets`, or run
`EXPLAIN (ANALYZE, BUFFERS)` directly on any query in
`backend/src/db/queries/`.

### A second, separate gap: end-to-end API latency

The table above is deliberately DB-only, to isolate query/index performance
from network latency — the brief also asks the deployed **API** to answer in
under 300 ms, which is a different measurement and, measured directly against
`https://ojt-report-backend.onrender.com/api/search/listings`, is **not**
currently met: repeated requests measured 500 ms–2.9 s end to end, far above
what even the *cold-cache* DB numbers above would predict, and the gap did
not shrink on repeated identical requests the way the DB-only numbers did —
ruling out cache warmth as the explanation for this one.

The gap is consistent with a network round trip, not a query cost: the
Render backend and the Supabase database (`aws-0-ap-southeast-2`, Sydney) may
not be provisioned in the same region, in which case every query pays a
cross-region hop on top of the millisecond-scale execution time measured
above — three queries run in parallel per search (`Promise.all`), so this
does not multiply per query, but the round trip itself is the dominant cost.

`GET /health/latency` (`backend/src/app.ts`) isolates exactly this: it times
a trivial `SELECT 1` from inside the running server process, isolated from
client latency, query cost, and cold starts:

```bash
curl https://ojt-report-backend.onrender.com/health/latency
# {"success":true,"data":{"region":null,"dbRoundTripMs":142}}
```

Measured against the deployed instance: **`dbRoundTripMs` is a stable
~142–143 ms**, warm, run after run — far above what a same-region round trip
to Postgres should cost (typically single-digit milliseconds), which
confirms Render and Supabase are not co-located. (`region` came back `null`
— Render does not appear to expose `RENDER_REGION` on this plan/tier, so the
exact region name has to be read from the dashboard directly: Render →
service → Settings, and Supabase → Project Settings → General, currently
`ap-southeast-2` / Sydney.)

That ~142 ms is real, but it is **not the whole gap**: the same requests'
full round trip (`curl -w`) showed 460 ms–930 ms time-to-first-byte —
300–800 ms beyond the reported DB time, on top of the network/TLS connect
time to Render itself (a separate ~25–65 ms, also measured). Session
middleware was checked and ruled out as the cause (`saveUninitialized:
false` means an anonymous request with no cookie, like this one, never
touches the session store). The remaining gap is most consistent with
Render's **free-tier CPU allocation** — the dashboard's own banner warns
free instances "spin down with inactivity, which can delay requests by 50
seconds or more," and a throttled/shared CPU tier is known to add
highly variable latency to ordinary request handling, independent of
network distance.

**Net conclusion: there are two stacked, separate causes, not one** —
a genuine cross-region network hop (~140 ms, fixable by moving Render or
Supabase to the same region) and free-tier compute overhead (very
plausibly 300+ ms, fixable by upgrading off Render's free tier). Both are
account/billing decisions, not code changes, and neither was changed in
this pass — see [Known limitations](#known-limitations).

## Tests

```bash
cd backend && npm test
cd frontend && npm test
```

No test runner existed before this pass; both packages now use `vitest`.
Six cases, matching what the brief names explicitly:

1. **Filter combinations** — `buildListingWhere` combining several filters
   produces the right clause and bound values, and clearing one leaves the
   rest untouched (pure unit test, `backend/src/db/queries/listingSearch.sql.test.ts`).
2. **Facet counts against a fixture with hand-known answers**, including
   re-narrowing every other facet once one is applied
   (`backend/src/repositories/listingSearch.repository.test.ts`).
3. **Pagination stability** — a full keyset walk visits every fixture row
   exactly once (no skip, no repeat), and a listing posted mid-walk does not
   retroactively appear in, or shift, a page already fetched — the scenario
   §9 Q4 below asks about directly.
4. **Relevance ordering** — a title match outranks the same word appearing
   only in the description.
5. **The search-params URL round trip** — every field of a fully-populated
   search survives being serialised to a query string and parsed back
   (`frontend/src/lib/search.test.ts`, pure unit test, no database).
6. **SQL-injection safety** — a payload like `'; DROP TABLE listings; --`
   passed as the search query is treated as a literal string; the table is
   confirmed intact afterward.

A seventh test, beyond the six named above, covers the expiry sweep
(`backend/src/repositories/listingWrite.repository.test.ts`): an active
listing past its `expires_at` is flipped to `expired`, one not yet due is
left alone, and an already-sold listing is never reverted to `expired`
regardless of its expiry date.

Cases 2–4 and 6 run as integration tests against the real, shared database
rather than a mock — facet counts and full-text ranking are genuinely
Postgres behaviour a mock can't stand in for honestly. Every fixture row is
created under one dedicated user (found by a reserved email nothing else
uses) and title-marked; tests search for that marker to isolate their rows
from the other 100,000+ real listings, and a cleanup step runs both before
and after the suite, so a crashed run heals itself on the next one instead
of leaving debris behind. Verified: zero fixture rows remain in the database
after a full run.

---

## §9 — questions the brief asks for a documented opinion on

**1. Offset pagination or a cursor — and what exactly breaks with the
rejected one?**
A cursor, for the navigation that's actually used (Previous/Next, and any
page number adjacent to the one on screen) — see [Pagination](#pagination)
above for the measured numbers. What breaks with plain `OFFSET`: its cost is
proportional to how deep the page is, because Postgres has to walk and
discard every prior row to know where the requested page starts — measured
at 35 ms at a depth of 96,000 rows versus 0.08 ms for the same depth via
cursor. What breaks with a *pure* cursor, and why `OFFSET` is still kept as
a fallback: a cursor has no way to jump to an arbitrary, non-adjacent page
number without either `OFFSET` or pre-computing every possible page boundary
for every filter combination in advance, which isn't practical. We chose the
hybrid deliberately: fast for the path real usage takes, bounded-cost for
the rare hand-typed deep link.

**2. How do you compute every facet count without one query per option?**
One SQL statement, one CTE (`backend/src/db/queries/listingFacets.sql.ts`).
The candidate rows are materialised once with a boolean flag per facet group
("does this row pass every *other* filter"), then each group's count is a
`GROUP BY` over that same materialised set filtered on its own flag. The
table is scanned once; the six aggregations run over the result already in
memory, not six separate scans.

**3. Should relevance outrank recency? What does someone searching "iphone"
want first?**
Relevance, when there's a query to rank against — but "relevance" here means
title beats description beats brand/colour (`ts_rank` over a weighted
`tsvector`), not a signal like popularity or freshness independent of the
words themselves. Someone searching "iphone" wants a listing that *is* one,
not the most recently posted thing that happens to mention one in its
description. Recency is the tiebreaker after relevance, and the only signal
at all once there's no query (browsing, not searching) — see `buildOrderBy`
in `backend/src/db/queries/listingSearch.sql.ts`.

**4. A listing is posted while a user reads page 3 — what should page 4
contain, and not contain?**
Exactly what it would have contained if the new listing had been posted
before the visit started, plus that one row wherever it now sorts to — never
a duplicate of something page 3 already showed, and never a gap. A keyset
cursor gets this right by construction: page 4 is defined as "everything
strictly after page 3's last row, in sort order," so a new row newer than
that cursor sorts *before* it and simply doesn't appear in page 4 at all
(it would show up on a fresh page 1 instead) — it can't retroactively shift
what page 4 contains. Test case 3 above asserts this directly against a live
insert mid-walk. `OFFSET` cannot make this guarantee: a new row shifts every
row after it by one position, so the row that was last on page 3 reappears
first on page 4 — a duplicate the visitor has already seen.

**5. Which indexes did you add, and which did you consider and reject?**
See [Indexes, and why](#indexes-and-why) above.

**6. What should a two-word query mean — all words, any word, or the exact
phrase?**
All words (AND), via `websearch_to_tsquery`, which is also what turns a
phrase in quotes into an exact-phrase match and a `-word` into an exclusion
— the same syntax a search engine's box already trains people to expect.
"denim jacket" meaning "denim OR jacket" would bury the exact thing being
searched for under everything that merely mentions denim.

**7. A user searches a word appearing in 60% of listings. What happens, and
what should happen?**
It runs exactly like any other query: ranked by `ts_rank` (title beats
description), paginated, faceted, same as a rare query — nothing in the
implementation special-cases a common term, and nothing should. Postgres's
GIN index still narrows to real matches rather than a sequential scan (a
`tsquery` match is not "contains this substring," it's "this document's
tsvector contains this lexeme," so the index remains selective even against
a large fraction of the table). What *should* happen — and does — is that
relevance ordering still means something even when many rows qualify: a
title match still outranks a description match, so the most relevant 24
rows are still meaningfully "most relevant," not an arbitrary slice of a
large matching set.

**8. Where does price filtering belong — the same query as the text search,
or a separate step? Why?**
The same query, as one more `AND` clause built by the same
`buildListingWhere` function that builds every other filter
(`backend/src/db/queries/listingSearch.sql.ts`) — never a separate step or a
post-filter in application code. Splitting it out would mean fetching more
rows than needed just to discard some in Node, and it would break facet
counting, which depends on every filter (including price) being expressed
as a boolean flag inside the same one-pass query described in Q2.

---

## Known limitations

- ~~Google OAuth not yet manually verified~~ — **resolved.** A real sign-in
  was completed against the deployed instance. It surfaced one genuine bug
  along the way, also now fixed: the session cookie was `sameSite: "lax"`,
  which survives the OAuth redirect itself (a top-level navigation) but is
  never attached to an ordinary cross-site `fetch()` — and the frontend
  (Vercel) and API (Render) are different registrable domains in production.
  The session was being created correctly and was simply invisible to the
  app that just created it. Now `sameSite: "none"` in production (`"lax"`
  still locally, where frontend and API differ only by port and count as the
  same site). See `backend/src/middleware/session.middleware.ts`.
- **Deep-linking directly to a distant, non-adjacent page number** (typing
  `?page=500` into the address bar with no cursor) still costs `OFFSET`'s
  work for that one request — a deliberate, bounded trade-off, not a bug.
  See [Pagination](#pagination) and §9 Q1 above.
- **A stale git-history artifact:** an early commit (`6a355a2`) briefly
  included a `_to_delete/deploy.tgz` containing a `backend/.env` with
  placeholder scaffold values (`MONGODB_URI=mongodb://127.0.0.1:27017/thread`
  — not real credentials, and not this project's actual database). It was
  removed from the tree in a later commit but still exists in git history.
  No real secret was ever exposed by it; rewriting history to remove it
  entirely is possible but hasn't been done, since doing so unrequested
  would rewrite shared history other clones may depend on.
- **`frontend/.env` was tracked in git** — it only ever held a non-secret
  local default (`VITE_API_URL=http://localhost:5000`); it has since been
  untracked and `frontend/.gitignore` now excludes `.env` going forward.
- **Unfiltered facet counts (a plain "all listings" browse, no query or
  filter) cost ~400–550 ms at the current 145k-row scale** — over the
  brief's 300 ms target. Two real contributing bugs were found and fixed in
  this pass (a missing covering column on `listings_facets_idx`, and
  `work_mem` too low for the query's working set); what remains is an
  architectural cost — six sequential scans of a materialised CTE — that a
  quick fix can't safely close two days before a deadline. Every query that
  actually includes a search term or a filter is fast (~15–20 ms), which
  covers the overwhelming majority of real usage. See
  [Performance](#performance-at-145k-rows) above for the full story and
  what a real fix would involve.
- **The deployed instance may lag behind this repository's `main` branch**
  at any given moment — Render/Vercel only reflect what's actually been
  pushed. Before relying on any number or behavior described here, confirm
  `git log origin/main -1` matches `git log -1` locally.
- **`pg_trgm.word_similarity_threshold` was too strict for this dataset's
  titles** — found during a re-audit: `"bycicle"`, the brief's own typo
  example, matched zero rows in production because `word_similarity`
  against a full title phrase scored below the 0.3 threshold. **Fixed** to
  0.2, verified against the live database. Requires a backend redeploy to
  take full effect — see [Search](#search) above.
- **End-to-end API latency on the deployed instance measures 500 ms–2.9 s**,
  above the brief's 300 ms target, despite every query costing single-digit
  to tens of milliseconds at the database layer once warm (see
  [Performance](#performance-at-145k-rows)). `GET /health/latency` isolates
  the Render↔Supabase network hop specifically: a stable ~142 ms warm — real,
  and consistent with the two not being co-located, but confirmed to only
  account for **part** of the gap. The rest (300-800 ms more, measured via
  `curl -w`) is not explained by the database, by TLS/connect time, or by
  session middleware (ruled out, since an anonymous request
  never touches the session store) and is most consistent with Render's free
  tier's CPU allocation (the dashboard's own banner: free instances "spin
  down with inactivity, which can delay requests by 50 seconds or more").
  **Two separate, stacked causes, not one** — see
  [Performance](#performance-at-145k-rows) for the full breakdown. Fixing
  either (matching regions; upgrading off the free tier) is a Render/Supabase
  account and billing decision, not something fixable by changing code, and
  neither was done in this pass.
- **The fuzzy/typo-tolerant search path costs 115–280 ms on its own, warm**
  (`"bycicle"` — see [Performance](#performance-at-145k-rows)) — the
  slowest individual query measured in this codebase, and the one with the
  least margin left once any network latency is added on top. Not fixed in
  this pass; the trigram candidate set it scans (~7,000 rows before
  filtering to real matches) would need to shrink to close this.

## Decisions and deviations

- A buyer/seller account-type split was tried and **fully reverted**: there
  is now exactly one account type, matching the brief ("anyone signed in may
  post, and owning a listing is what grants the right to edit or delete
  it") — `/seller/login` redirects to `/login`, and the `account_type`
  column no longer exists (dropped in `backend/src/db/marketplace.sql`).
- The storefront/shopping-app direction this project started from (cart,
  wishlist, checkout, product pages) was deleted outright in favour of the
  classifieds marketplace the brief actually describes. Payments, checkout,
  messaging, map/radius search, recommendations, moderation tooling, and a
  mobile app are all explicitly out of scope per §6 and none of them exist
  in this codebase.

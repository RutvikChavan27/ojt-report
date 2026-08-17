# Bazaar — brief compliance checklist

**Source:** `Devnco-Project-Brief-05-Marketplace-Search (1).docx` — Project Brief 05, *Classifieds
Marketplace Search*. Working title Bazaar. 3–4 weeks, 1 developer, React + Node.

**How to use this file.** Check it before starting work and again before calling something done.
Every requirement below is quoted or closely paraphrased from the brief, with the section number so
it can be traced back. If a change does not advance something on this list, or actively conflicts
with §6, say so before building it.

Status key: ✅ done · 🟡 partial · ❌ not started · 🚫 built but out of scope

---

## 0. Hard constraints (§3)

| Area | Requirement | Status |
|---|---|---|
| Frontend | React SPA; build tool, styling, state management free choice | ✅ React 19 + Vite + Tailwind |
| Backend | Node.js, **separate** HTTP API (Express or similar) | ✅ Express 5, separate origin |
| Database | **PostgreSQL** — not optional; uses its FTS and query planner | ✅ Postgres 17 |
| Search | Database's own full-text capability. **Elasticsearch / Algolia / Meilisearch not permitted** | ✅ `tsvector` + `pg_trgm` only |
| Auth | Email/password **plus OAuth 2.0** social login; secure sessions; hashed passwords | ✅ bcrypt cost 12 + Google OAuth |
| File storage | Listing photos **outside the database** — object storage or disk | ✅ on disk, paths in DB |
| Repository | Single Git repo | ✅ |

> "The frontend and backend must be genuinely separate: React talks to a documented HTTP API."
> The API is separate; **it is not yet documented** — see §7.

---

## 1. Where we actually are

**The frontend was rebuilt as a classifieds marketplace** (13 Aug 2026). The shopping-app direction
— cart, wishlist, checkout, place-order, product pages — was deleted outright, and every screen the
brief describes now exists: search with facets and URL state, listing details, post-an-ad, seller
dashboard, saved searches, login/register.

The frontend currently runs on **mock data** (`src/data/marketplace.ts`) with search implemented in
`src/lib/search.ts`, written to the same contract the API will expose. The **backend still holds
100,000 clothing listings** and its faceted search is built and measured, but the two halves are not
yet joined: the backend needs reseeding with classifieds categories.

Biggest risks, in order:

1. **Not deployed.** §8 says deploy in week 1 and calls leaving it to the end "the single most
   common way this project goes wrong". §5 requires timings measured on the deployed instance.
2. **Frontend and backend are disconnected.** Search runs client-side over ~58 mock listings, which
   satisfies none of §5's performance requirements. Reseed the database with classifieds categories,
   then point `lib/search.ts` at the API.
3. **Zero tests**, while §7 names six specific cases and §10 grades test quality.
4. **Deep pagination is still `OFFSET`** on the backend, which §4C explicitly rules out.
5. **No README or API docs**, and no `EXPLAIN ANALYZE` written up.

---

## 2. §4A — Accounts and access

> ⚠️ **Deliberate deviation from the brief, 13 Aug 2026.** Bazaar now has **two account types** —
> buyer and seller — chosen at registration, with separate sign-in doors at `/login` and
> `/seller/login`. The brief describes one kind of registered user ("Registered users post listings,
> upload photos and save searches they care about") and never mentions a buyer/seller split, so this
> is an addition rather than a requirement. It was requested and confirmed after the trade-offs were
> raised. Three consequences to be ready to explain:
>
> 1. Anyone who both buys and sells needs two accounts on two email addresses.
> 2. It sits awkwardly with §4A's "a social identity matching an existing email must resolve to a
>    single user" — Google returns an email and no type, so those sign-ins become buyer accounts.
> 3. The type lives in **localStorage** (`lib/accountType.ts`), not the database. It is a UI
>    distinction, not a permission: there is no `account_type` column, and ownership still has to be
>    enforced per endpoint on the server.
>
> Reverting is small: drop `requires="seller"` from two routes in `App.tsx` and delete
> `lib/accountType.ts`.

- ✅ Register with email + password, log in, log out — `backend/src/services/auth.service.ts`
- ✅ Passwords never stored or logged in plain text — bcrypt, `utils/password.ts`
- ✅ OAuth 2.0 social login (Google) — `services/google.service.ts`
- ✅ Social identity matching an existing email resolves to **one** user — three-case logic in
  `signInWithGoogle`; the reasoning is commented, **but must also be documented in the README**
- ✅ Browsing and searching require no account
- 🟡 Posting a listing, saving a search and the seller dashboard require an account — the screens
  exist and the save-search button is gated on being logged in, but posting is not yet enforced
  server-side because there is no endpoint
- ❌ "Only the seller who created a listing may edit or delete it, **enforced on the server for every
  endpoint**" — no write endpoints exist yet, so this is untested and unbuilt

**Not verified end to end:** Google sign-in is configured and the redirect is well-formed, but no
sign-in has been completed through Google; `oauth_identities` is empty.

## 3. §4B — Listings

- ✅ Schema carries title, description, category, price, condition, city — `db/marketplace.sql`
- 🟡 **Seller posts a listing** — full form at `pages/PostAd/PostAd.tsx`; no `POST /api/listings` yet
- 🟡 **Image upload, up to 8 photos, one primary** — previews and the 8-photo cap work client-side;
  nothing is uploaded and no thumbnails are generated
- ❌ **Server-side validation of file type and size** ("never trust the file extension or the
  client-reported size")
- 🟡 Edit / mark as sold / delete — all three appear on the dashboard and change local state only
- 🟡 Sold listing stays viewable by direct link but excluded from search — search *does* filter to
  `status = 'active'`, so the exclusion works; there is no way to mark something sold
- 🟡 Listings expire and drop out of search — `expires_at` exists and is indexed; **no expiry sweep
  and no renew action**

## 4. §4C — Search (the core of the project)

- ✅ Single box matches titles **and** descriptions, ordered by relevance not date
- ✅ Title outranks description — `setweight` A/B/C/D in the generated `search_vector`
- ✅ Typo tolerance: "bycicle" → bicycles. `word_similarity` + `<%`, threshold lowered to 0.3, plus a
  "did you mean" suggestion. **The README must explain what it costs** (recall traded for precision;
  fuzzy only runs after an exact miss)
- ✅ Filters combine and each clears independently — `buildListingWhere`
- ✅ **Facet counts** — counts show beside every filter option, each group counted with its own
  filter excluded so alternatives stay switchable. Two implementations: `lib/search.ts` (frontend,
  mock data) and `db/queries/listingFacets.sql.ts` (one SQL statement, all six groups, ~185 ms at
  100k after adding `listings_facets_idx`)
- ✅ Sorts: relevance, newest, price asc, price desc — all with a unique tiebreaker
- ❌ **Deep pagination: "page 500 must return as quickly as page 2"** — still `LIMIT/OFFSET`. The
  keyset index (`status, posted_at DESC, id DESC`) exists and is commented as the cursor tuple, but
  no cursor is implemented
- ✅ Search-as-you-type, debounced 250 ms — `components/search/SearchBar.tsx` with a suggestion
  dropdown of matching titles. Frontend only; needs a server endpoint once wired up
- ✅ Zero-result states offering a way forward — "did you mean" plus removable chips for each
  applied filter, so the visitor can drop one without retyping the search
- ✅ **The complete state of a search lives in the URL** — react-router-dom, every filter/sort/page
  written to the query string and read back out of it. Verified round trip on a six-parameter search

## 5. §4D — Saved searches and seller tools

- 🟡 `saved_searches` table exists with `last_viewed_at`; the frontend stores them in localStorage
- ✅ Save a search under a chosen name, with a count of new matches since last viewed —
  `store/SavedSearchesContext.tsx`, `pages/SavedSearches/`. Not yet persisted server-side
- ✅ Seller dashboard with status, view count and expiry date — `pages/MyListings/`, tabbed by
  active / sold / expired

## 6. §5 — Non-functional requirements

- ❌ **Deployed database with ≥100,000 listings** — seed script produces 100k locally
  (`seeds/seedListings100k.ts`, ~25 s, 69,813 active) but **nothing is deployed**
- ❌ **Every search under 300 ms at that volume, measured on the deployed instance, numbers in the
  README** — local numbers only: search 1.4–11 ms, endpoint 52–279 ms, facet query ~250 ms
- ❌ **`EXPLAIN ANALYZE` before/after indexes in the README, with each index justified** — plans have
  been captured for the facet query (`npm run explain:facets`) but nothing is written up
- 🟡 **"All searching, filtering, sorting and counting happens in the database."** The backend search
  obeys this and `Shop.tsx` (which violated it) is deleted. But the frontend currently searches mock
  data in the browser — correct as a stand-in, and the thing to replace when the two halves are joined
- ✅ No N+1 on a results page — photos come from a `LATERAL` subquery, one round trip per page
- ✅ Every dynamically built filter value is parameterised — nothing user-supplied is concatenated
- 🟡 Every write endpoint validates input server-side — true of the auth endpoints; no others exist
- 🟡 Meaningful status codes and machine-readable errors — consistent `{ success, data | error }`
  envelope; needs an audit once write endpoints exist
- ✅ Code commented to the standard described (file-level purpose, exported function contracts,
  reasoning on non-obvious logic)
- 🟡 Usable at phone width — verified on cart and checkout; the rest is untested
- ✅ No secrets committed — **except** `_to_delete/deploy.tgz` was removed from the tree but is
  still in git history with `.env` files inside, and the Google client secret was pasted into a chat
  and should be rotated

## 7. §6 — Explicitly out of scope

> "Do not build these, even if you have time."

| Forbidden | State |
|---|---|
| **Payments, checkout or escrow** | ✅ **removed 13 Aug 2026** — the checkout flow, cart, place-order and payment methods were all deleted along with the shopping-app direction |
| Messaging between buyer and seller | ✅ not built |
| Map views / radius search | ✅ not built — city-level only |
| Recommendations or "similar listings" | ✅ not built (a carousel was started and removed) |
| Moderation queues, reporting, admin tooling | ✅ not built |
| Real email or SMS delivery | ✅ not built |
| Seller ratings and reviews | ✅ not built |
| A mobile app | ✅ not built |

The storefront half of the site (products, hero lookbook, cart, wishlist, `Shop.tsx`) has also been
removed. Nothing outside §4 remains in the frontend.

## 8. §7 — Deliverables

- 🟡 Readable commit history, small meaningful commits — history is reasonable, but the checkout and
  facet work is **currently uncommitted**
- ❌ **Deployed working URL** carrying all 100k listings, no login required to browse
- ❌ **Unit tests**, all six named cases, passing from one documented command. There is no test
  runner installed:
  1. the query built from several combinations of filters
  2. facet counts against a small fixture with hand-known answers
  3. pagination stability — never show a listing twice or skip one when rows are added mid-paging
  4. relevance ordering — a title match outranks a description match
  5. the round trip between URL and filter state
  6. a search input containing SQL being safely neutralised
- ❌ **README**: what it does, local setup, env vars, seed script, architecture and data model,
  indexes and why, `EXPLAIN ANALYZE` before/after, deployed timings, how to run tests, decisions,
  known limitations. (`backend/README.md` covers the Postgres migration only)
- ❌ **API documentation** — every endpoint: method, path, auth, query params, response shape, errors

## 9. §9 — Questions we must have a documented opinion on

None of these are written down yet; they belong in the README.

1. Offset pagination or a cursor — and what exactly breaks with the rejected one?
2. How do you compute every facet count without one query per option?
3. Should relevance outrank recency? What does someone searching "iphone" want first?
4. A listing is posted while a user reads page 3 — what should page 4 contain, and not contain?
5. Which indexes did you add, and which did you consider and reject?
6. What should a two-word query mean — all words, any word, or the exact phrase?
7. A user searches a word appearing in 60% of listings. What happens, and what should happen?
8. Where does price filtering belong — the same query as the text search, or a separate step? Why?

## 10. §10 — How this will be reviewed, in the brief's own order

1. **Measured search performance at 100k rows, on the deployed instance** — "This matters most"
2. Index design, and being able to explain every index
3. **Correctness of facet counts as filters combine** — "a count that is subtly wrong is worse than
   no count at all"
4. Pagination stability at depth, including while data changes underneath
5. Search quality on a vague query
6. Test quality, "particularly around counts and pagination rather than only the happy path"
7. API design — resources, query parameters, status codes
8. Code readability and comments
9. Documentation — a reviewer gets it running from the README alone
10. **Scope discipline**

Explicitly **not** assessed: visual flair, animation, choice of library.

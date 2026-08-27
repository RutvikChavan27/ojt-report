/**
 * Integration tests against the real database — see `../test/fixtures.ts`.
 *
 * These target the pagination self-heal in `searchListings`: a page that
 * comes back with zero rows despite a nonzero `total` must never be handed
 * to the client as-is (an "empty last page" with results the count claims
 * exist). The service must re-check reality and land on a page that is
 * actually valid, or correctly report zero results.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { query } from "../config/database";
import {
  connectTestDatabase,
  disconnectTestDatabase,
  pickCategorySlugs,
  seedFixtureUser,
  seedListings,
  wipeFixtures,
} from "../test/fixtures";
import { searchListings } from "./listingSearch.service";

let sellerId: number;
let categorySlug: string;

beforeAll(async () => {
  await connectTestDatabase();
  await wipeFixtures();
  sellerId = await seedFixtureUser();
  [categorySlug] = await pickCategorySlugs(1);
});

afterAll(async () => {
  await wipeFixtures();
  await disconnectTestDatabase();
});

describe("searchListings pagination never returns an empty page over a nonzero total", () => {
  const MARKER = "ZZZVITESTPAGEHEAL";
  const PER_PAGE = 24;
  const TOTAL_ROWS = 30; // 2 pages at 24/page: 24 + 6.

  beforeAll(async () => {
    await seedListings(
      sellerId,
      Array.from({ length: TOTAL_ROWS }, (_, index) => ({
        title: `${MARKER} item ${index}`,
        categorySlug,
      })),
    );
  });

  it("a page number far past the real last page lands on the real last page, not an empty one", async () => {
    const result = await searchListings({
      q: MARKER,
      sort: "newest",
      page: 999_999,
      perPage: PER_PAGE,
    });

    // This is the invariant the bug violated: a nonzero total reported
    // alongside zero items. Whatever page it lands on, it must have rows.
    expect(result.total).toBe(TOTAL_ROWS);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.page).toBe(Math.ceil(TOTAL_ROWS / PER_PAGE));
  });

  it("the real last page itself has the correct remainder, not the full page size", async () => {
    const lastPage = Math.ceil(TOTAL_ROWS / PER_PAGE);
    const result = await searchListings({
      q: MARKER,
      sort: "newest",
      page: lastPage,
      perPage: PER_PAGE,
    });

    expect(result.items.length).toBe(TOTAL_ROWS - (lastPage - 1) * PER_PAGE);
  });

  it("re-checks and reports zero when every matching row is gone by the time the page renders", async () => {
    // Simulates the real-world case this bug came from: the count a page was
    // built from is now stale because the matching rows were removed in the
    // meantime (an expiry sweep, a sale, a deletion) — not a hand-typed bad
    // page number, but the same "rows disagree with total" shape.
    const rows = await query<{ id: string }>(
      `SELECT id::text FROM listings WHERE title LIKE $1`,
      [`%${MARKER}%`],
    );
    await query(`UPDATE listings SET status = 'expired' WHERE title LIKE $1`, [
      `%${MARKER}%`,
    ]);

    try {
      const result = await searchListings({
        q: MARKER,
        sort: "newest",
        page: 2,
        perPage: PER_PAGE,
      });

      // Genuinely zero matches now — must say so honestly, not fabricate
      // results or leave a stale nonzero total standing.
      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    } finally {
      // Restore for any test that runs after this one in the same file.
      await query(`UPDATE listings SET status = 'active' WHERE id = ANY($1::bigint[])`, [
        rows.rows.map((r) => r.id),
      ]);
    }
  });

  /**
   * The bug this whole file exists for: `total` and this page's rows are two
   * separate queries, and under a genuinely concurrent write landing between
   * them, they can legitimately disagree — this is what the old
   * `requestedPage > pageCount` check missed, because on the *exact* last
   * page (the common, real case someone actually lands on) that comparison
   * is `false` by definition, not `true`. Firing a real concurrent UPDATE
   * against the real database, repeated, is how this project already tests
   * timing-sensitive behaviour elsewhere (see "pagination stability" in
   * listingSearch.repository.test.ts) rather than mocking the race away.
   */
  it("stays consistent under a real concurrent write racing the request, repeated", async () => {
    const RACE_MARKER = "ZZZVITESTPAGERACE";
    const ROWS = 26; // Just over one page at 24/page, so the last page (2) starts thin.

    const ids = await seedListings(
      sellerId,
      Array.from({ length: ROWS }, (_, index) => ({
        title: `${RACE_MARKER} item ${index}`,
        categorySlug,
      })),
    );

    try {
      for (let attempt = 0; attempt < 15; attempt += 1) {
        const [result] = await Promise.all([
          searchListings({
            q: RACE_MARKER,
            sort: "newest",
            page: 2,
            perPage: PER_PAGE,
          }),
          // Races the search: flips the tail rows (what page 2 would show)
          // to sold, mid-flight, on a separate connection.
          query(`UPDATE listings SET status = 'sold' WHERE id = ANY($1::bigint[])`, [
            ids.slice(PER_PAGE),
          ]),
        ]);

        // The invariant the bug violated, whichever side of the race won:
        // a nonzero total can never come back with an empty page.
        if (result.total > 0) {
          expect(result.items.length).toBeGreaterThan(0);
        } else {
          expect(result.items).toEqual([]);
        }

        // Reset for the next attempt.
        await query(`UPDATE listings SET status = 'active' WHERE id = ANY($1::bigint[])`, [
          ids,
        ]);
      }
    } finally {
      await query(`UPDATE listings SET status = 'active' WHERE id = ANY($1::bigint[])`, [ids]);
    }
  });
});

describe("searchListings stays on fuzzy matching across pages of the same search", () => {
  // A long compound token with no natural word break, the same shape a real
  // typo/compound listing title takes: to_tsvector treats it as one lexeme,
  // so an exact search for a mere prefix of it finds nothing — only trigram
  // similarity does. This is exactly the case that only ever matches via the
  // fuzzy path, on every page, not just the first.
  // Deliberately does NOT start with "ZZZVITEST" (unlike every other marker in
  // this file): `seedListings` already prepends that as its own separate word
  // on every fixture row, so a query starting with it would fuzzy-match every
  // *other* fixture row in this file too via that shared prefix, defeating the
  // isolation this marker exists for.
  const STEM = "QWKXJMBLR7734QP";
  const QUERY = "QWKXJMBLR7734"; // a strict prefix of STEM, not the whole token
  const PER_PAGE = 24;
  const TOTAL_ROWS = 26;

  beforeAll(async () => {
    await seedListings(
      sellerId,
      Array.from({ length: TOTAL_ROWS }, (_, index) => ({
        title: `${STEM} item ${index}`,
        categorySlug,
      })),
    );
  });

  it("page 1 finds nothing via exact match and falls back to fuzzy", async () => {
    const result = await searchListings({
      q: QUERY,
      sort: "relevance",
      page: 1,
      perPage: PER_PAGE,
    });

    expect(result.fuzzy).toBe(true);
    expect(result.total).toBe(TOTAL_ROWS);
    expect(result.items.length).toBe(PER_PAGE);
  });

  it("page 2, told the search is fuzzy, returns the remainder instead of an empty exact-only miss", async () => {
    const result = await searchListings({
      q: QUERY,
      sort: "relevance",
      page: 2,
      perPage: PER_PAGE,
      fuzzy: true, // what the frontend now echoes back from page 1's own response
    });

    expect(result.fuzzy).toBe(true);
    expect(result.total).toBe(TOTAL_ROWS);
    expect(result.items.length).toBe(TOTAL_ROWS - PER_PAGE);
  });

  it("every item across both pages is a genuine match, not an unrelated listing", async () => {
    const [page1, page2] = await Promise.all([
      searchListings({ q: QUERY, sort: "relevance", page: 1, perPage: PER_PAGE }),
      searchListings({ q: QUERY, sort: "relevance", page: 2, perPage: PER_PAGE, fuzzy: true }),
    ]);

    const allTitles = [...page1.items, ...page2.items].map((item) => item.title);
    expect(allTitles).toHaveLength(TOTAL_ROWS);
    expect(allTitles.every((title) => title.includes(STEM))).toBe(true);

    // No duplicate across the two pages, and no gap: every seeded row shown exactly once.
    expect(new Set(allTitles).size).toBe(TOTAL_ROWS);
  });
});

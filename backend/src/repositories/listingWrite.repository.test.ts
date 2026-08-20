import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  connectTestDatabase,
  disconnectTestDatabase,
  pickCategorySlugs,
  seedFixtureUser,
  seedListings,
  wipeFixtures,
} from "../test/fixtures";
import { sweepExpiredListings } from "./listingWrite.repository";
import { query } from "../config/database";

beforeAll(async () => {
  await connectTestDatabase();
  await wipeFixtures();
});

afterAll(async () => {
  await wipeFixtures();
  await disconnectTestDatabase();
});

describe("sweepExpiredListings", () => {
  it("flips only active listings whose expiry has passed, leaving everything else untouched", async () => {
    const sellerId = await seedFixtureUser();
    const [categorySlug] = await pickCategorySlugs(1);
    const now = Date.now();

    const [pastExpiry, futureExpiry, alreadySold] = await seedListings(sellerId, [
      {
        title: "ZZZVITESTEXPIRY past",
        categorySlug,
        status: "active",
        expiresAt: new Date(now - 60 * 60 * 1000), // an hour ago
      },
      {
        title: "ZZZVITESTEXPIRY future",
        categorySlug,
        status: "active",
        expiresAt: new Date(now + 60 * 60 * 1000), // an hour from now
      },
      {
        title: "ZZZVITESTEXPIRY sold",
        categorySlug,
        status: "sold",
        expiresAt: new Date(now - 60 * 60 * 1000), // also past, but already sold
      },
    ]);

    const swept = await sweepExpiredListings();
    expect(swept).toBeGreaterThanOrEqual(1);

    const { rows } = await query<{ id: string; status: string }>(
      `SELECT id::text, status::text FROM listings WHERE id = ANY($1::bigint[])`,
      [[pastExpiry, futureExpiry, alreadySold]],
    );
    const statusOf = (id: string) => rows.find((row) => row.id === id)?.status;

    expect(statusOf(pastExpiry)).toBe("expired");
    expect(statusOf(futureExpiry)).toBe("active"); // not due yet — untouched
    expect(statusOf(alreadySold)).toBe("sold"); // sold takes priority — never reverted to expired
  });
});

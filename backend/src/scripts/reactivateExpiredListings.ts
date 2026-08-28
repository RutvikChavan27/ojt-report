/**
 * Tops the active listing count back up toward TARGET_ACTIVE by renewing a
 * slice of expired listings — the same status/date transition
 * `renewListing` already performs for a single listing (repositories/
 * listingWrite.repository.ts), applied in bulk.
 *
 * The expiry sweep (server.ts) is expiry-driven, not deletion-driven: a
 * seed row seeded "active" simply keeps aging until its `expires_at`
 * passes, then flips to 'expired' on its own, which is why the active
 * share drifts down from the seed's original ~70% over time. This does
 * not create or delete any row — it only reverses that drift for the
 * rows whose `expires_at` lapsed most recently (ORDER BY expires_at DESC),
 * since those are the ones a real seller would still plausibly renew,
 * rather than an ad that has sat expired for over a year.
 *
 * `posted_at`/`expires_at` are regenerated with the exact formula
 * seedMarketplace100k.ts uses for genuinely-active rows (posted within
 * the last 45 days, expires_at = posted_at + 45 days), so a reactivated
 * row is statistically indistinguishable from one seeded active in the
 * first place — same "posted N days ago" spread, same newest-first sort
 * behaviour, and it will not be swept straight back to expired on the
 * next sweep tick.
 *
 * Run with: npm run listings:reactivate-expired
 */
import { config } from "../config/env";
import { connectDatabase, disconnectDatabase, query } from "../config/database";

const SHELF_LIFE_DAYS = 45;
/** Chosen to land the active count near the middle of the 120k-130k band
 *  the brief calls for, with margin either side of a single sweep tick. */
const TARGET_ACTIVE = 125_000;

type StatusCount = { status: string; c: string };

async function statusCounts() {
  const { rows } = await query<StatusCount>(
    `SELECT status, count(*)::text AS c FROM listings GROUP BY status ORDER BY status`,
  );
  return rows;
}

async function main(): Promise<void> {
  await connectDatabase(config.databaseUrl);

  const before = await statusCounts();
  console.log("[reactivate] before:", before);

  const activeNow = Number(before.find((r) => r.status === "active")?.c ?? 0);
  const toReactivate = TARGET_ACTIVE - activeNow;

  if (toReactivate <= 0) {
    console.log(
      `[reactivate] already at ${activeNow} active (>= target ${TARGET_ACTIVE}); nothing to do`,
    );
    await disconnectDatabase();
    return;
  }

  const { rows: renewed } = await query<{ id: string }>(
    `WITH candidates AS (
       SELECT id FROM listings
        WHERE status = 'expired'
        ORDER BY expires_at DESC
        LIMIT $1
     ),
     offsets AS (
       SELECT id, random() * $2 AS days_ago FROM candidates
     )
     UPDATE listings l
        SET status = 'active',
            posted_at = now() - (o.days_ago || ' days')::interval,
            expires_at = now() - (o.days_ago || ' days')::interval
                         + ($2 || ' days')::interval,
            updated_at = now()
       FROM offsets o
      WHERE l.id = o.id
      RETURNING l.id`,
    [toReactivate, SHELF_LIFE_DAYS],
  );

  console.log(`[reactivate] renewed ${renewed.length} listings`);

  const after = await statusCounts();
  console.log("[reactivate] after:", after);

  await disconnectDatabase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

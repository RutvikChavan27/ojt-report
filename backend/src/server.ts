import { createApp } from "./app";
import { config } from "./config/env";
import { connectDatabase } from "./config/database";
import { sweepExpiredListings } from "./repositories/listingWrite.repository";

/**
 * How often to flip active-but-past-`expires_at` listings to `expired`.
 *
 * There is no job queue in this stack, so a plain timer on the one running
 * process is the whole mechanism — the sweep itself is a single idempotent
 * `UPDATE`, so a slightly-late run costs nothing beyond one listing staying
 * technically visible a few minutes past its expiry, never incorrectness.
 */
const EXPIRY_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

function scheduleExpirySweep(): void {
  const run = () => {
    sweepExpiredListings()
      .then((count) => {
        if (count > 0) console.log(`[expiry] ${count} listing(s) expired`);
      })
      .catch((err) => console.error("[expiry] sweep failed:", err));
  };

  run();
  setInterval(run, EXPIRY_SWEEP_INTERVAL_MS);
}

async function start(): Promise<void> {
  await connectDatabase(config.databaseUrl);

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[server] API listening on http://localhost:${config.port}`);
    console.log(`[server] images served from ${config.imagesRoute}`);
  });

  scheduleExpirySweep();
}

start().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});

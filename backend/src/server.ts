import { createApp } from "./app";
import { config } from "./config/env";
import { connectDatabase } from "./config/database";

async function start(): Promise<void> {
  await connectDatabase(config.databaseUrl);

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[server] API listening on http://localhost:${config.port}`);
    console.log(`[server] images served from ${config.imagesRoute}`);
  });
}

start().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});

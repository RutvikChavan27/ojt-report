/**
 * Creates the database (if missing) and applies schema.sql.
 *
 * Run with: npm run migrate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { config } from "../config/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureDatabaseExists(): Promise<void> {
  const target = new URL(config.databaseUrl);
  const dbName = target.pathname.replace(/^\//, "");

  const adminUrl = new URL(config.databaseUrl);
  adminUrl.pathname = "/postgres";

  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rows } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [
      dbName,
    ]);
    if (rows.length === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[migrate] created database "${dbName}"`);
    }
  } finally {
    await admin.end();
  }
}

async function applySchema(): Promise<void> {
  const schema = fs.readFileSync(path.resolve(__dirname, "schema.sql"), "utf-8");
  const client = new Client({ connectionString: config.databaseUrl });
  await client.connect();
  try {
    await client.query(schema);
    console.log("[migrate] schema applied");
  } finally {
    await client.end();
  }
}

async function migrate(): Promise<void> {
  await ensureDatabaseExists();
  await applySchema();
}

migrate().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});

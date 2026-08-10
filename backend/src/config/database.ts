import { Pool, type QueryResultRow } from "pg";

let pool: Pool | undefined;

/** Opens the shared connection pool. Call once on startup. */
export async function connectDatabase(connectionString: string): Promise<void> {
  pool = new Pool({ connectionString });
  const { rows } = await pool.query<{ current_database: string }>(
    "select current_database()"
  );
  console.log(`[db] connected to ${rows[0].current_database}`);
}

/** Closes the pool (used by the seed/migrate scripts and on shutdown). */
export async function disconnectDatabase(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

/** Runs a parameterised query against the shared pool. */
export function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[] }> {
  if (!pool) throw new Error("Database pool not initialised — call connectDatabase first");
  return pool.query<T>(text, params);
}

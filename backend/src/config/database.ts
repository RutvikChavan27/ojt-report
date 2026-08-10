import mongoose from "mongoose";

/** Opens the shared Mongoose connection. Call once on startup. */
export async function connectDatabase(uri: string): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log(`[db] connected to ${mongoose.connection.name}`);
}

/** Closes the connection (used by the seed script and on shutdown). */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

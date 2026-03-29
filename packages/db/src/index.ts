import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import * as schema from "./schema";

const currentDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(currentDir, "../../../apps/server/.env"),
});

export function createDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is missing. Set it in apps/server/.env before running database commands.",
    );
  }

  return drizzle(databaseUrl, { schema });
}

export const db = createDb();
export * from "./schema";
export { asc, desc, eq } from "drizzle-orm";

import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: Database | null = null;

export function createDatabase(db: D1Database): Database {
  cachedDb ??= drizzle(db, { schema });

  return cachedDb;
}

export { schema };

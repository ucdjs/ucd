import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type ApiDatabase = ReturnType<typeof drizzle<typeof schema>>;

export function createDb(db: D1Database): ApiDatabase {
  return drizzle(db, { schema });
}

export { schema };

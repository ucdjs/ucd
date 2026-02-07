import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { existsSync } from "node:fs";
import process from "node:process";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

interface CreateDatabaseOptions {
  url?: string;
  authToken?: string;
}

export function createDatabase(options: CreateDatabaseOptions = {}): Database {
  const url = options.url ?? process.env.DB_URL ?? "file:./pipeline-server.db";
  const authToken = options.authToken ?? process.env.DB_AUTH_TOKEN;

  const client = createClient({ url, authToken });

  return drizzle(client, { schema });
}

export async function runMigrations(db: Database): Promise<void> {
  const migrationsFolder = new URL("./migrations", import.meta.url).pathname;

  if (!existsSync(migrationsFolder)) {
    throw new Error(
      `Migrations folder not found at ${migrationsFolder}. `
      + "Run 'pnpm db:generate' to create migrations.",
    );
  }

  await migrate(db, { migrationsFolder });
}

export { schema };

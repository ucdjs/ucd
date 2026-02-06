import type { Client } from "@libsql/client";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

interface CreateDatabaseOptions {
  url?: string;
  authToken?: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

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

export function closeDatabase(db: Database): void {
  // The drizzle instance wraps the client, we need to close the underlying client
  const client = (db as unknown as { $client: Client }).$client;
  client.close();
}

// Re-export schema for convenience
export { schema };

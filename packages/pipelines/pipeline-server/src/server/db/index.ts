import { existsSync } from "node:fs";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { getUcdConfigPath } from "@ucdjs/env";
import { drizzle } from "drizzle-orm/node-sqlite";
import { migrate } from "drizzle-orm/node-sqlite/migrator";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

interface CreateDatabaseOptions {
  url?: string;
}

export function createDatabase(options: CreateDatabaseOptions = {}): Database {
  const defaultUrl = `file:${getUcdConfigPath("ucd-pipelines.db")}`;
  const url = options.url ?? process.env.DB_URL ?? defaultUrl;

  const sqlite = new DatabaseSync(url);

  return drizzle({ client: sqlite, schema });
}

export async function runMigrations(db: Database): Promise<void> {
  const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));

  if (!existsSync(migrationsFolder)) {
    throw new Error(
      `Migrations folder not found at ${migrationsFolder}. `
      + "Run 'pnpm db:generate' to create migrations.",
    );
  }

  migrate(db, { migrationsFolder });
}

export { schema };

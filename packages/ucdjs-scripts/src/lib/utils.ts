import type { UCDClient } from "@ucdjs/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createUCDClient } from "@ucdjs/client";

export function getMonorepoRoot(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  let currentDir = __dirname;

  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error("Could not find monorepo root (pnpm-workspace.yaml not found)");
}

export function parseVersions(versions: string | undefined): string[] | undefined {
  if (!versions) {
    return undefined;
  }
  const parsed = versions.split(",").map((v) => v.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : undefined;
}

let cachedBaseUrl: string | undefined;
let cachedClient: UCDClient | null = null;

export async function getClient(baseUrl: string) {
  if (cachedClient && cachedBaseUrl === baseUrl) {
    return cachedClient;
  }

  cachedBaseUrl = baseUrl;
  cachedClient = await createUCDClient(baseUrl);
  return cachedClient;
}

import type { UCDClient } from "@ucdjs/client";
import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createUCDClientWithConfig, discoverEndpointsFromConfig } from "@ucdjs/client";

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
let cachedEndpoints: UCDWellKnownConfig["endpoints"] | null = null;

export async function getClientContext(baseUrl: string): Promise<{
  client: UCDClient;
  endpoints: UCDWellKnownConfig["endpoints"];
}> {
  if (cachedClient && cachedEndpoints && cachedBaseUrl === baseUrl) {
    return {
      client: cachedClient,
      endpoints: cachedEndpoints,
    };
  }

  const config = await discoverEndpointsFromConfig(baseUrl);
  cachedBaseUrl = baseUrl;
  cachedEndpoints = config.endpoints;
  cachedClient = createUCDClientWithConfig(baseUrl, config);

  return {
    client: cachedClient,
    endpoints: cachedEndpoints,
  };
}

export async function getClient(baseUrl: string) {
  return (await getClientContext(baseUrl)).client;
}

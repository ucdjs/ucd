/**
 * Parse a comma-separated list of versions into an array.
 * Returns undefined if the input is undefined or empty.
 */
import { createUCDClient } from "@ucdjs/client";

export function parseVersions(versions: string | undefined): string[] | undefined {
  if (!versions) {
    return undefined;
  }
  const parsed = versions.split(",").map((v) => v.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : undefined;
}

let cachedBaseUrl: string | undefined;
let cachedClient: Awaited<ReturnType<typeof createUCDClient>> | null = null;

export async function getClient(baseUrl: string) {
  if (cachedClient && cachedBaseUrl === baseUrl) {
    return cachedClient;
  }

  cachedBaseUrl = baseUrl;
  cachedClient = await createUCDClient(baseUrl);
  return cachedClient;
}

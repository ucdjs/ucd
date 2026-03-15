import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createUCDClient } from "@ucdjs/client";

/**
 * @typedef {import("@ucdjs/client").UCDClient} UCDClient
 */

/**
 * @returns {string}
 */
export function getMonorepoRoot() {
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

/**
 * @param {string | undefined} versions
 * @returns {string[] | undefined}
 */
export function parseVersions(versions) {
  if (!versions) {
    return undefined;
  }
  const parsed = versions.split(",").map((v) => v.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : undefined;
}

/** @type {string | undefined} */
let cachedBaseUrl;
/** @type {UCDClient | null} */
let cachedClient = null;

/**
 * @param {string} baseUrl
 * @returns {Promise<UCDClient>}
 */
export async function getClient(baseUrl) {
  if (cachedClient && cachedBaseUrl === baseUrl) {
    return cachedClient;
  }

  cachedBaseUrl = baseUrl;
  cachedClient = await createUCDClient(baseUrl);
  return cachedClient;
}

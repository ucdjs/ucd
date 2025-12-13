import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { HonoEnv } from "../../types";
import { DEFAULT_USER_AGENT } from "@ucdjs/env";
import { traverse } from "apache-autoindex-parse/traverse";
import { Hono } from "hono";
import { badGateway, unauthorized } from "../../lib/errors";
import { parseUnicodeDirectory } from "../../lib/files";

export const TASKS_ROUTER = new Hono<HonoEnv>().basePath("/_tasks");

/**
 * Matches Unicode version directory names.
 *
 * Supports formats like:
 * - "16.0.0", "15.1.0", "4.1.0"
 * - "4.1-Update", "4.1-Update1", "3.2-Update"
 */
// eslint-disable-next-line regexp/no-unused-capturing-group
const VERSION_PATTERN = /^(\d+)\.(\d+)(?:\.(\d+))?(?:-Update\d*)?$/;

function isVersionDirectory(name: string): boolean {
  return VERSION_PATTERN.test(name);
}

/**
 * Middleware to verify task API key.
 */
TASKS_ROUTER.use("/*", async (c, next) => {
  const apiKey = c.req.header("X-UCDJS-Task-Key");
  const expectedKey = await c.env.UCDJS_TASK_API_KEY.get();

  if (!expectedKey) {
    console.error("[tasks]: UCDJS_TASK_API_KEY not configured");
    return badGateway(c);
  }

  if (!apiKey || apiKey !== expectedKey) {
    return unauthorized(c, { message: "Invalid or missing task key" });
  }

  await next();
});

async function getExpectedFilesForVersion(version: string): Promise<string[]> {
  const baseUrl = `https://unicode.org/Public/${version}`;

  try {
    const files: string[] = [];

    await traverse(baseUrl, {
      extraHeaders: {
        "User-Agent": DEFAULT_USER_AGENT,
      },
      onFile: (file) => {
        const relativePath = file.path.replace(`/${version}/`, "").replace(/^\//, "");
        if (relativePath) {
          files.push(relativePath);
        }
      },
    });

    return files;
  } catch (error) {
    console.error(`[tasks]: failed to fetch files for version ${version}:`, error);
    return [];
  }
}

TASKS_ROUTER.post("/refresh-manifest", async (c) => {
  const startTime = Date.now();
  const bucket = c.env.UCD_BUCKET;

  if (!bucket) {
    console.error("[tasks]: UCD_BUCKET binding not configured");
    return badGateway(c);
  }

  // Fetch version list from unicode.org
  const response = await fetch("https://unicode.org/Public?F=2", {
    headers: { "User-Agent": DEFAULT_USER_AGENT },
  });

  if (!response.ok) {
    console.error(`[tasks]: failed to fetch unicode.org directory: ${response.status}`);
    return badGateway(c);
  }

  const html = await response.text();
  const files = await parseUnicodeDirectory(html);
  const versionDirs = files.filter((file) => isVersionDirectory(file.name));

  // eslint-disable-next-line no-console
  console.log(`[tasks]: found ${versionDirs.length} versions to process`);

  const store: UCDStoreManifest = {};
  let totalFiles = 0;

  // Process versions in batches to avoid overwhelming unicode.org
  const BATCH_SIZE = 5;
  for (let i = 0; i < versionDirs.length; i += BATCH_SIZE) {
    const batch = versionDirs.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (file) => {
        // eslint-disable-next-line no-console
        console.log(`[tasks]: processing version ${file.name}`);
        const expectedFiles = await getExpectedFilesForVersion(file.name);
        // @ts-expect-error We will fix this later.
        store[file.name] = { expectedFiles };
        totalFiles += expectedFiles.length;
      }),
    );

    // Small delay between batches to be polite
    if (i + BATCH_SIZE < versionDirs.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Write manifest to R2
  await bucket.put("ucd-store-manifest.json", JSON.stringify(store), {
    httpMetadata: {
      contentType: "application/json",
    },
  });

  const duration = Date.now() - startTime;
  // eslint-disable-next-line no-console
  console.log(`[tasks]: updated manifest with ${Object.keys(store).length} versions in ${duration}ms`);

  return c.json({
    success: true,
    versionsUpdated: Object.keys(store).length,
    totalFiles,
    duration,
  }, 200);
});

TASKS_ROUTER.get("/health", async (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  }, 200);
});

import type { HonoEnv } from "#types";
import { createDatabase } from "#db";
import { versions } from "#db/schema";
import { isValidUnicodeVersion } from "@ucdjs-internal/shared";
import {
  badGateway,
  badRequest,
  buildR2Key,
  clearCacheEntry,
  isValidWorkflowInstanceId,
  makeManifestUploadId,
  MAX_TAR_SIZE_BYTES,
  unauthorized,
} from "@ucdjs-internal/worker-utils";
import { resolveUCDVersion, UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import {
  V1_VERSIONS_DETAIL_CACHE_NAME,
  V1_VERSIONS_LIST_CACHE_NAME,
  V1_VERSIONS_ROUTER_BASE_PATH,
  WELL_KNOWN_ROUTER_BASE_PATH,
  WELL_KNOWN_UCD_CONFIG_CACHE_NAME,
} from "../../constants";

export const TASKS_ROUTER = new Hono<HonoEnv>().basePath("/_tasks");

TASKS_ROUTER.use("/*", async (c, next) => {
  // Skip auth for local development - safe since it's only localhost:8787
  if (c.env.ENVIRONMENT === "local") {
    return next();
  }

  // eslint-disable-next-line no-console
  console.log(`[tasks]: Authenticating request to ${c.req.url}`);
  const apiKey = c.req.header("X-UCDJS-Task-Key")?.trim();
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.log("[tasks]: Missing X-UCDJS-Task-Key header");
    return unauthorized(c, { message: "Missing task key" });
  }

  // eslint-disable-next-line no-console
  console.log(`[tasks]: Received API key: ${apiKey.length === 0 ? "(empty)" : "(redacted)"} (length: ${apiKey.length})`);
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

TASKS_ROUTER.post("/upload-manifest", bodyLimit({
  maxSize: MAX_TAR_SIZE_BYTES,
  onError(c) {
    return badRequest(c, { message: `Request body exceeds maximum size of ${Math.round(MAX_TAR_SIZE_BYTES / 1024 / 1024)}MB` });
  },
}), async (c) => {
  const workflow = c.env.MANIFEST_UPLOAD_WORKFLOW;

  if (!workflow) {
    console.error("[tasks]: MANIFEST_UPLOAD_WORKFLOW binding not configured");
    return badGateway(c);
  }

  // Get version from query parameter
  const version = c.req.query("version");
  if (!version) {
    return badRequest(c, { message: "Missing 'version' query parameter" });
  }

  if (!isValidUnicodeVersion(version)) {
    return badRequest(c, { message: `Invalid version format: ${version}. Expected format: X.Y.Z (e.g., 16.0.0)` });
  }

  const contentType = c.req.header("Content-Type");
  if (contentType !== "application/x-tar" && contentType !== "application/gzip") {
    return badRequest(c, { message: "Content-Type must be application/x-tar or application/gzip" });
  }

  try {
    const workflowId = makeManifestUploadId(version);
    const r2Key = buildR2Key(version, workflowId);

    const tarData = await c.req.arrayBuffer();
    await c.env.UCD_BUCKET.put(r2Key, tarData, {
      httpMetadata: {
        contentType,
      },
    });

    // Check if the file exists in the R2 bucket
    const uploadedFile = await c.env.UCD_BUCKET.head(r2Key);
    if (!uploadedFile) {
      console.error(`[tasks]: Uploaded file is not available in R2 bucket with key ${r2Key}`);
      return badGateway(c, { message: "File upload verification failed: File not found in R2 bucket" });
    }

    const instance = await workflow.create({
      id: workflowId,
      params: {
        version,
        r2Key,
      },
    });

    // eslint-disable-next-line no-console
    console.log(`[tasks]: Started manifest upload workflow ${instance.id} for version ${version}`);

    // Determine base URL for status endpoint
    const url = new URL(c.req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    return c.json({
      success: true,
      workflowId: instance.id,
      status: "queued",
      statusUrl: `${baseUrl}/_tasks/upload-status/${instance.id}`,
    }, 202);
  } catch (err) {
    console.error("[tasks]: Failed to start workflow:", err);
    return badGateway(c);
  }
});

TASKS_ROUTER.get("/upload-status/:workflowId", async (c) => {
  const workflowId = c.req.param("workflowId");

  if (!workflowId) {
    return badRequest(c, { message: "Missing workflow ID" });
  }

  if (!isValidWorkflowInstanceId(workflowId)) {
    return badRequest(c, { message: "Invalid workflow ID or workflow not found" });
  }

  const workflow = c.env.MANIFEST_UPLOAD_WORKFLOW;

  if (!workflow) {
    console.error("[tasks]: MANIFEST_UPLOAD_WORKFLOW binding not configured");
    return badGateway(c);
  }

  try {
    const instance = await workflow.get(workflowId);
    const status = await instance.status();

    return c.json({
      workflowId,
      status: status.status,
      output: status.output,
      error: status.error?.message,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "instance.not_found") {
      return badRequest(c, { message: "Invalid workflow ID or workflow not found" });
    }

    console.error("[tasks]: Failed to get workflow status:", err);
    return badRequest(c, { message: "Invalid workflow ID or workflow not found" });
  }
});

TASKS_ROUTER.post("/reindex-versions", async (c) => {
  let body: { versions?: string[] } = {};
  const contentLength = c.req.header("Content-Length");
  const contentType = c.req.header("Content-Type");
  const hasBody = (contentLength != null && Number(contentLength) > 0)
    || (contentType != null && contentType.includes("application/json"));

  if (hasBody) {
    try {
      body = await c.req.json<{ versions?: string[] }>();
    } catch {
      return badRequest(c, { message: "Request body must be valid JSON" });
    }
  }

  if (body.versions != null && !Array.isArray(body.versions)) {
    return badRequest(c, { message: "Request body field 'versions' must be an array of version strings" });
  }

  const requestedVersions = body.versions?.map((version) => version.trim()).filter(Boolean);
  if (requestedVersions) {
    const invalidVersion = requestedVersions.find((version) => !isValidUnicodeVersion(version));
    if (invalidVersion) {
      return badRequest(c, { message: `Invalid version format: ${invalidVersion}. Expected format: X.Y.Z (e.g., 16.0.0)` });
    }
  }

  const availableMetadata = new Map(
    UNICODE_VERSION_METADATA.map((version) => [version.version, version] as const),
  );
  const versionsToIndex = requestedVersions ?? [...availableMetadata.keys()];
  const missingMetadata = versionsToIndex.filter((version) => !availableMetadata.has(version));
  if (missingMetadata.length > 0) {
    return badRequest(c, {
      message: `Unsupported reindex version(s): ${missingMetadata.join(", ")}. Update @unicode-utils/core metadata first.`,
    });
  }

  try {
    const db = createDatabase(c.env.UCD_DATA);
    const results: Array<{ version: string; indexed: true }> = [];

    for (const version of versionsToIndex) {
      const metadata = availableMetadata.get(version)!;
      const [major = 0, minor = 0, patch = 0] = version.split(".").map((part) => Number.parseInt(part, 10) || 0);
      const mappedUcdVersion = resolveUCDVersion(version);
      const now = new Date();

      await db
        .insert(versions)
        .values({
          version,
          major,
          minor,
          patch,
          documentationUrl: `https://www.unicode.org/versions/Unicode${version}/`,
          date: metadata.date ?? null,
          url: `https://www.unicode.org/Public/${mappedUcdVersion}`,
          mappedUcdVersion: mappedUcdVersion === version ? null : mappedUcdVersion,
          status: metadata.type,
          manifestPath: null,
          snapshotPath: null,
          fileCount: null,
          totalSize: null,
          publishedAt: null,
          indexedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: versions.version,
          set: {
            major,
            minor,
            patch,
            documentationUrl: `https://www.unicode.org/versions/Unicode${version}/`,
            date: metadata.date ?? null,
            url: `https://www.unicode.org/Public/${mappedUcdVersion}`,
            mappedUcdVersion: mappedUcdVersion === version ? null : mappedUcdVersion,
            status: metadata.type,
            manifestPath: null,
            snapshotPath: null,
            fileCount: null,
            totalSize: null,
            publishedAt: null,
            indexedAt: now,
            updatedAt: now,
          },
        });

      results.push({
        version,
        indexed: true,
      });
    }

    const origin = new URL(c.req.url).origin;
    const purgeTargets = [
      {
        cacheName: V1_VERSIONS_LIST_CACHE_NAME,
        path: V1_VERSIONS_ROUTER_BASE_PATH,
      },
      {
        cacheName: WELL_KNOWN_UCD_CONFIG_CACHE_NAME,
        path: `${WELL_KNOWN_ROUTER_BASE_PATH}/ucd-config.json`,
      },
      {
        cacheName: V1_VERSIONS_DETAIL_CACHE_NAME,
        path: `${V1_VERSIONS_ROUTER_BASE_PATH}/latest`,
      },
      ...versionsToIndex.map((version) => ({
        cacheName: V1_VERSIONS_DETAIL_CACHE_NAME,
        path: `${V1_VERSIONS_ROUTER_BASE_PATH}/${version}`,
      })),
    ];

    await Promise.all(purgeTargets.map(async ({ cacheName, path }) => {
      const clearCache = await clearCacheEntry(cacheName);
      await clearCache(`${origin}${path}`);
    }));

    const indexed = results.filter((result) => result.indexed);

    return c.json({
      success: true,
      indexed: indexed.length,
      skipped: 0,
      results,
    }, 200);
  } catch (err) {
    console.error("[tasks]: failed to reindex versions:", err);
    // eslint-disable-next-line e18e/prefer-static-regex
    if (err instanceof Error && /no such table:\s*versions/i.test(err.message)) {
      return badGateway(c, {
        message: "Missing D1 schema for the versions table. Apply API D1 migrations before reindexing.",
      });
    }

    return badGateway(c);
  }
});

TASKS_ROUTER.get("/purge-cache", async (c) => {
  const cacheName = c.req.query("cacheName");
  const path = c.req.query("path");

  if (!cacheName) {
    return badRequest(c, { message: "Missing 'cacheName' query parameter" });
  }

  if (!path) {
    return badRequest(c, { message: "Missing 'path' query parameter" });
  }

  if (!path.startsWith("/")) {
    return badRequest(c, { message: "Path must start with /" });
  }

  try {
    const clearCache = await clearCacheEntry(cacheName);
    const url = new URL(c.req.url);
    const cacheUrl = `${url.origin}${path}`;
    await clearCache(cacheUrl);
    // eslint-disable-next-line no-console
    console.log(`[tasks]: purged cache for ${cacheUrl}`);

    return c.json({
      success: true,
      cacheName,
      purgedUrl: cacheUrl,
    }, 200);
  } catch (err) {
    console.error("[tasks]: failed to purge cache:", err);
    return badGateway(c);
  }
});

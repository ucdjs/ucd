import type { HonoEnv } from "#types";
import { isValidUnicodeVersion } from "@ucdjs-internal/shared";
import {
  badGateway,
  badRequest,
  buildR2Key,
  clearCacheEntry,
  makeManifestUploadId,
  MAX_TAR_SIZE_BYTES,
  unauthorized,
} from "@ucdjs-internal/worker-utils";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

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
    console.error("[tasks]: Failed to get workflow status:", err);
    return badRequest(c, { message: "Invalid workflow ID or workflow not found" });
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
  } catch (error) {
    console.error("[tasks]: failed to purge cache:", error);
    return badGateway(c);
  }
});

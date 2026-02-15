import type { HonoEnv } from "../../types";
import { Hono } from "hono";
import { clearCacheEntry } from "../../lib/cache";
import { badGateway, badRequest, unauthorized } from "../../lib/errors";
import { makeManifestUploadId, MAX_TAR_SIZE_BYTES } from "../../lib/tasks";

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
  console.log(`[tasks]: Received API key: ${apiKey}`);
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

TASKS_ROUTER.post("/upload-manifest", async (c) => {
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

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    return badRequest(c, { message: `Invalid version format: ${version}. Expected format: X.Y.Z (e.g., 16.0.0)` });
  }

  const contentType = c.req.header("Content-Type");
  if (contentType !== "application/x-tar" && contentType !== "application/gzip") {
    return badRequest(c, { message: "Content-Type must be application/x-tar or application/gzip" });
  }

  try {
    const tarBuffer = await c.req.arrayBuffer();

    // Check size limit
    if (tarBuffer.byteLength > MAX_TAR_SIZE_BYTES) {
      return badRequest(c, {
        message: `TAR file size (${Math.round(tarBuffer.byteLength / 1024 / 1024)}MB) exceeds maximum of 50MB`,
      });
    }

    // Convert to base64 for workflow params
    const bytes = new Uint8Array(tarBuffer);
    let binaryString = "";
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]!);
    }
    const tarBase64 = btoa(binaryString);

    // Trigger workflow
    const instance = await workflow.create({
      id: makeManifestUploadId(version),
      params: {
        version,
        tarData: tarBase64,
        contentType,
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
    }, 202); // 202 Accepted for async processing
  } catch (error) {
    console.error("[tasks]: Failed to start workflow:", error);
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
      error: status.error,
    });
  } catch (error) {
    console.error("[tasks]: Failed to get workflow status:", error);
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

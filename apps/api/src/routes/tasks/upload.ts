import type { HonoEnv } from "#types";
import { isValidUnicodeVersion } from "@ucdjs-internal/shared";
import {
  badGateway,
  badRequest,
  buildR2Key,
  isValidWorkflowInstanceId,
  makeManifestUploadId,
  MAX_TAR_SIZE_BYTES,
} from "@ucdjs-internal/worker-utils";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

export const TASK_UPLOAD_ROUTER = new Hono<HonoEnv>();

TASK_UPLOAD_ROUTER.post("/upload-manifest", bodyLimit({
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

TASK_UPLOAD_ROUTER.get("/upload-status/:workflowId", async (c) => {
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

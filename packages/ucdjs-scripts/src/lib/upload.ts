import type { TaskUploadQueuedResult, TaskUploadStatusResult, UploadOptions } from "../types";
import { logger } from "./logger";

export async function uploadManifest(
  tar: Uint8Array,
  version: string,
  options: UploadOptions,
): Promise<TaskUploadQueuedResult> {
  const { baseUrl, taskKey } = options;
  const url = new URL("/_tasks/upload-manifest", baseUrl);
  url.searchParams.set("version", version);

  const headers: Record<string, string> = {
    "Content-Type": "application/x-tar",
  };

  if (taskKey) {
    headers["X-UCDJS-Task-Key"] = taskKey;
  }

  logger.info(`Uploading manifest for ${version} to ${url.toString()}...`);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: tar as unknown as BodyInit,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const result = (await response.json()) as TaskUploadQueuedResult;
  return result;
}

export async function getUploadStatus(
  workflowId: string,
  options: UploadOptions,
): Promise<TaskUploadStatusResult> {
  const { baseUrl, taskKey } = options;
  const url = new URL(`/_tasks/upload-status/${workflowId}`, baseUrl);

  const headers: Record<string, string> = {};
  if (taskKey) {
    headers["X-UCDJS-Task-Key"] = taskKey;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Status check failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  return (await response.json()) as TaskUploadStatusResult;
}

const TERMINAL_SUCCESS = new Set(["complete", "completed", "success", "succeeded"]);
const TERMINAL_FAILURE = new Set(["failed", "error", "errored", "terminated", "canceled", "cancelled"]);

export async function waitForUploadCompletion(
  workflowId: string,
  options: UploadOptions,
  pollIntervalMs = 1000,
  timeoutMs = 120_000,
): Promise<TaskUploadStatusResult> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const status = await getUploadStatus(workflowId, options);
    const normalized = status.status.toLowerCase();

    if (TERMINAL_SUCCESS.has(normalized)) {
      return status;
    }

    if (TERMINAL_FAILURE.has(normalized)) {
      throw new Error(status.error || `Workflow ${workflowId} failed with status: ${status.status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timed out waiting for workflow ${workflowId} after ${timeoutMs}ms`);
}

export async function getRemoteManifestEtag(version: string, options: UploadOptions): Promise<string | null> {
  const url = new URL(`/.well-known/ucd-store/${version}.json`, options.baseUrl);

  const headResponse = await fetch(url.toString(), {
    method: "HEAD",
  });

  if (headResponse.ok) {
    const headEtag = headResponse.headers.get("ETag")?.trim();
    if (headEtag) {
      return headEtag;
    }
  }

  const getResponse = await fetch(url.toString(), {
    method: "GET",
  });

  if (getResponse.ok) {
    const getEtag = getResponse.headers.get("ETag")?.trim();
    if (getEtag) {
      return getEtag;
    }
  }

  if (headResponse.status !== 404 && getResponse.status !== 404) {
    logger.warn(
      `Failed to fetch remote ETag for ${version} (HEAD ${headResponse.status}, GET ${getResponse.status}).`,
    );
  }

  return null;
}

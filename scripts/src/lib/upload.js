import { logger } from "./logger.js";

/**
 * @typedef {import("../types.js").TaskUploadQueuedResult} TaskUploadQueuedResult
 * @typedef {import("../types.js").TaskUploadStatusResult} TaskUploadStatusResult
 * @typedef {import("../types.js").UploadOptions} UploadOptions
 */

/**
 * @param {Uint8Array} tar
 * @param {string} version
 * @param {UploadOptions} options
 * @returns {Promise<TaskUploadQueuedResult>}
 */
export async function uploadManifest(tar, version, options) {
  const { baseUrl, taskKey } = options;
  const url = new URL("/_tasks/upload-manifest", baseUrl);
  url.searchParams.set("version", version);

  /** @type {Record<string, string>} */
  const headers = {
    "Content-Type": "application/x-tar",
  };

  if (taskKey) {
    headers["X-UCDJS-Task-Key"] = taskKey;
  }

  logger.info(`Uploading manifest for ${version} to ${url.toString()}...`);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: Uint8Array.from(tar).buffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  return /** @type {TaskUploadQueuedResult} */ (await response.json());
}

/**
 * @param {string} workflowId
 * @param {UploadOptions} options
 * @returns {Promise<TaskUploadStatusResult>}
 */
export async function getUploadStatus(workflowId, options) {
  const { baseUrl, taskKey } = options;
  const url = new URL(`/_tasks/upload-status/${workflowId}`, baseUrl);

  /** @type {Record<string, string>} */
  const headers = {};
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

  return /** @type {TaskUploadStatusResult} */ (await response.json());
}

const TERMINAL_SUCCESS = new Set(["complete", "completed", "success", "succeeded"]);
const TERMINAL_FAILURE = new Set(["failed", "error", "errored", "terminated", "canceled", "cancelled"]);

/**
 * @param {string} workflowId
 * @param {UploadOptions} options
 * @param {number=} pollIntervalMs
 * @param {number=} timeoutMs
 * @returns {Promise<TaskUploadStatusResult>}
 */
export async function waitForUploadCompletion(
  workflowId,
  options,
  pollIntervalMs = 1000,
  timeoutMs = 120_000,
) {
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

/**
 * @param {string} version
 * @param {UploadOptions} options
 * @returns {Promise<string | null>}
 */
export async function getRemoteManifestEtag(version, options) {
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

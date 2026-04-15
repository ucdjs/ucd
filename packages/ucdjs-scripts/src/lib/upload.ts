import type {
  GeneratedManifest,
  UploadResult,
} from "../types";
import { logger } from "./logger";
import { createManifestTar } from "./manifest";

const MANIFEST_BUNDLE_ETAG_HEADER = "X-UCD-Manifest-Bundle-Etag";

interface TaskUploadQueuedResult {
  success: boolean;
  workflowId: string;
  status: string;
  statusUrl: string;
}

interface TaskUploadStatusResult {
  workflowId: string;
  status: string;
  output?: {
    success?: boolean;
    version?: string;
    filesUploaded?: number;
    duration?: number;
    workflowId?: string;
  };
  error?: string;
}

export async function getUploadStatus(
  workflowId: string,
  options: RawUploadOptions,
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
  options: RawUploadOptions,
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

export async function getRemoteManifestEtag(version: string, options: RawUploadOptions): Promise<string | null> {
  const manifestUrls = [
    new URL(`/api/v1/versions/${version}/manifest`, options.baseUrl),
    new URL(`/.well-known/ucd-store/${version}.json`, options.baseUrl),
  ];

  for (const url of manifestUrls) {
    const headResponse = await fetch(url.toString(), {
      method: "HEAD",
    });

    if (headResponse.ok) {
      const headEtag = headResponse.headers.get(MANIFEST_BUNDLE_ETAG_HEADER)?.trim()
        ?? headResponse.headers.get("ETag")?.trim();
      if (headEtag) {
        return headEtag;
      }
    }

    const getResponse = await fetch(url.toString(), {
      method: "GET",
    });

    if (getResponse.ok) {
      const getEtag = getResponse.headers.get(MANIFEST_BUNDLE_ETAG_HEADER)?.trim()
        ?? getResponse.headers.get("ETag")?.trim();
      if (getEtag) {
        return getEtag;
      }
    }

    if (headResponse.status !== 404 && getResponse.status !== 404) {
      logger.warn(
        `Failed to fetch remote ETag for ${version} from ${url.pathname} (HEAD ${headResponse.status}, GET ${getResponse.status}).`,
      );
      return null;
    }
  }

  return null;
}

export interface UploadManifestsOptions extends RawUploadOptions {
  shouldSkip?: (manifest: GeneratedManifest) => Promise<boolean> | boolean;
}

export async function uploadManifest(
  manifests: GeneratedManifest[],
  options: UploadManifestsOptions,
): Promise<UploadResult> {
  const result: UploadResult = {
    success: true,
    uploaded: 0,
    skipped: 0,
    errors: [],
    versions: [],
  };

  for (const manifest of manifests) {
    if (await options.shouldSkip?.(manifest)) {
      result.skipped += 1;
      continue;
    }

    logger.info(`Preparing manifest tar for ${manifest.version}...`);
    const tar = createManifestTar(manifest);
    logger.info(`Tar archive size for ${manifest.version}: ${tar.byteLength} bytes`);

    try {
      const queued = await uploadRawManifest(tar, manifest.version, options);
      logger.info(`Queued workflow ${queued.workflowId} for ${manifest.version}`);

      const completed = await waitForUploadCompletion(queued.workflowId, options);
      logger.info(`Completed workflow ${queued.workflowId} for ${manifest.version} (${completed.status})`);

      result.uploaded += 1;
      result.versions.push({
        version: manifest.version,
        date: manifest.date,
        status: manifest.status,
        fileCount: manifest.fileCount,
      });
    } catch (error) {
      result.success = false;
      result.errors.push({
        version: manifest.version,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export interface RawUploadOptions {
  baseUrl: string;
  taskKey?: string;
}

export async function uploadRawManifest(
  tar: Uint8Array,
  version: string,
  options: RawUploadOptions,
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

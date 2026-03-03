import type { RefreshManifestsOptions, UploadResult } from "../types";
import { resolveConfig } from "#lib/config";
import { createLogger } from "#lib/logger";
import { createManifestEtag, createManifestTar, generateManifests } from "#lib/manifest";
import { getRemoteManifestEtag, uploadManifest, waitForUploadCompletion } from "#lib/upload";
import { parseVersions } from "#lib/utils";

const logger = createLogger("refresh-manifests");

interface QueuedUpload {
  version: string;
  fileCount: number;
  workflowId: string;
}

function normalizeEtag(etag: string): string {
  return etag.trim().replace(/^W\//i, "").replace(/^"|"$/g, "");
}

export async function refreshManifests(options: RefreshManifestsOptions): Promise<void> {
  const versions = parseVersions(options.versions);
  const batchSize = options.batchSize ?? 5;
  const dryRun = options.dryRun ?? false;

  // Resolve configuration
  const config = resolveConfig({
    env: options.env,
    baseUrl: options.baseUrl,
    taskKey: options.taskKey,
  });

  logger.info(`Target: ${config.baseUrl}`);
  if (dryRun) {
    logger.info("Dry run mode enabled - no changes will be made");
  }

  // Generate manifests
  logger.info("Generating manifests...");
  const manifests = await generateManifests({
    versions,
    apiBaseUrl: config.apiBaseUrl,
    batchSize,
  });

  logger.info(`Generated ${manifests.length} manifests`);

  const result: UploadResult = {
    success: true,
    uploaded: 0,
    skipped: 0,
    errors: [],
    versions: [],
  };

  if (dryRun) {
    applyDryRunResult(result, manifests);
  } else {
    const queuedUploads = await queueUploads(manifests, config.baseUrl, config.taskKey, result);
    await waitForQueuedUploads(queuedUploads, config.baseUrl, config.taskKey, result);
  }

  printResult(result, dryRun);
}

function applyDryRunResult(result: UploadResult, manifests: Awaited<ReturnType<typeof generateManifests>>): void {
  logger.info("Dry run mode: generated manifests only. Skipping upload to tasks endpoint.");
  result.skipped = manifests.length;
  result.versions = manifests.map((m) => ({
    version: m.version,
    fileCount: m.fileCount,
  }));
}

async function queueUploads(
  manifests: Awaited<ReturnType<typeof generateManifests>>,
  baseUrl: string,
  taskKey: string | undefined,
  result: UploadResult,
): Promise<QueuedUpload[]> {
  const queuedUploads: QueuedUpload[] = [];

  logger.info("Queueing manifest upload workflows...");
  for (const manifest of manifests) {
    const localEtag = createManifestEtag(manifest.manifest);
    const remoteEtag = await getRemoteManifestEtag(manifest.version, {
      baseUrl,
      taskKey,
    });

    if (remoteEtag && normalizeEtag(remoteEtag) === normalizeEtag(localEtag)) {
      logger.info(`Skipping ${manifest.version}: no manifest changes detected (${localEtag})`);
      result.skipped += 1;
      continue;
    }

    logger.info(`Preparing manifest tar for ${manifest.version}...`);
    const tar = createManifestTar(manifest);
    logger.info(`Tar archive size for ${manifest.version}: ${tar.byteLength} bytes`);

    try {
      const queued = await uploadManifest(tar, manifest.version, {
        baseUrl,
        taskKey,
      });

      logger.info(`Queued workflow ${queued.workflowId} for ${manifest.version}`);

      queuedUploads.push({
        version: manifest.version,
        fileCount: manifest.fileCount,
        workflowId: queued.workflowId,
      });
    } catch (err) {
      pushUploadError(result, manifest.version, err);
    }
  }

  return queuedUploads;
}

async function waitForQueuedUploads(
  queuedUploads: QueuedUpload[],
  baseUrl: string,
  taskKey: string | undefined,
  result: UploadResult,
): Promise<void> {
  logger.info(`Queued ${queuedUploads.length} workflows. Waiting for completion...`);

  for (const queued of queuedUploads) {
    try {
      const completed = await waitForUploadCompletion(queued.workflowId, {
        baseUrl,
        taskKey,
      });

      logger.info(`Completed workflow ${queued.workflowId} for ${queued.version} (${completed.status})`);

      result.uploaded += 1;
      result.versions.push({
        version: queued.version,
        fileCount: queued.fileCount,
      });
    } catch (err) {
      pushUploadError(result, queued.version, err);
    }
  }
}

function pushUploadError(result: UploadResult, version: string, error: unknown): void {
  result.success = false;
  result.errors.push({
    version,
    reason: error instanceof Error ? error.message : String(error),
  });
}

function printResult(result: UploadResult, dryRun: boolean): void {
  const divider = "=".repeat(50);
  const lines = [
    "",
    divider,
    dryRun ? "DRY RUN RESULT" : "UPLOAD RESULT",
    divider,
    `Success: ${result.success}`,
    `Uploaded: ${result.uploaded}`,
    `Skipped: ${result.skipped}`,
  ];

  if (result.versions.length > 0) {
    lines.push("", "Versions:");
    for (const v of result.versions) {
      lines.push(`  - ${v.version}: ${v.fileCount} expected files`);
    }
  }

  if (result.errors.length > 0) {
    lines.push("", "Errors:");
    for (const e of result.errors) {
      lines.push(`  - ${e.version}: ${e.reason}`);
    }
  }

  for (const line of lines) {
    logger.info(line);
  }
}

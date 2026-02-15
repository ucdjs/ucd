import type { RefreshManifestsOptions, UploadResult } from "../types";
import { resolveConfig } from "#lib/config";
import { createLogger } from "#lib/logger";
import { createManifestTar, generateManifests } from "#lib/manifest";
import { uploadManifest, waitForUploadCompletion } from "#lib/upload";
import { parseVersions } from "#lib/utils";

const logger = createLogger("refresh-manifests");

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
    logger.info("Dry run mode: generated manifests only. Skipping upload to tasks endpoint.");
    result.skipped = manifests.length;
    result.versions = manifests.map((m) => ({
      version: m.version,
      fileCount: m.fileCount,
    }));
  } else {
    for (const manifest of manifests) {
      logger.info(`Preparing manifest tar for ${manifest.version}...`);
      const tar = createManifestTar(manifest);
      logger.info(`Tar archive size for ${manifest.version}: ${tar.byteLength} bytes`);

      try {
        const queued = await uploadManifest(tar, manifest.version, {
          baseUrl: config.baseUrl,
          taskKey: config.taskKey,
        });

        logger.info(`Queued workflow ${queued.workflowId} for ${manifest.version}`);

        const completed = await waitForUploadCompletion(queued.workflowId, {
          baseUrl: config.baseUrl,
          taskKey: config.taskKey,
        });

        logger.info(`Completed workflow ${queued.workflowId} for ${manifest.version} (${completed.status})`);

        result.uploaded += 1;
        result.versions.push({
          version: manifest.version,
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
  }

  printResult(result, dryRun);
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

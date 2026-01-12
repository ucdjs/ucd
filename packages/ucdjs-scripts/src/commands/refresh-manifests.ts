import type { UploadResult } from "../lib/upload";
import { resolveConfig } from "../lib/config";
import { createLogger } from "../lib/logger";
import { generateManifests } from "../lib/manifest";
import { createManifestsTar } from "../lib/tar";
import { uploadManifests } from "../lib/upload";

const logger = createLogger("refresh-manifests");

export interface RefreshManifestsOptions {
  env?: string;
  baseUrl?: string;
  setupKey?: string;
  versions?: string;
  dryRun?: boolean;
  batchSize?: number;
  logLevel?: string;
}

export async function refreshManifests(options: RefreshManifestsOptions): Promise<void> {
  const versions = options.versions
    ? options.versions.split(",").map((v) => v.trim())
    : undefined;
  const batchSize = options.batchSize ?? 5;
  const dryRun = options.dryRun ?? false;

  // Resolve configuration
  const config = resolveConfig({
    env: options.env,
    baseUrl: options.baseUrl,
    setupKey: options.setupKey,
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

  // Create tar archive
  logger.info("Creating tar archive...");
  const tar = createManifestsTar(manifests);
  logger.info(`Tar archive size: ${tar.byteLength} bytes`);

  // Upload
  const result = await uploadManifests(tar, {
    baseUrl: config.baseUrl,
    setupKey: config.setupKey,
    dryRun,
  });

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

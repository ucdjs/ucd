import { resolveConfig } from "../lib/config";
import { logger } from "../lib/logger";
import { generateManifests } from "../lib/manifest";
import { createManifestsTar } from "../lib/tar";
import { uploadManifests, type UploadResult } from "../lib/upload";

export interface RefreshManifestsOptions {
  env?: string;
  baseUrl?: string;
  setupKey?: string;
  versions?: string;
  dryRun?: boolean;
  batchSize?: number;
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
  console.log("");
  console.log("=".repeat(50));
  console.log(dryRun ? "DRY RUN RESULT" : "UPLOAD RESULT");
  console.log("=".repeat(50));
  console.log(`Success: ${result.success}`);
  console.log(`Uploaded: ${result.uploaded}`);
  console.log(`Skipped: ${result.skipped}`);

  if (result.versions.length > 0) {
    console.log("\nVersions:");
    for (const v of result.versions) {
      console.log(`  - ${v.version}: ${v.fileCount} expected files`);
    }
  }

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    for (const e of result.errors) {
      console.log(`  - ${e.version}: ${e.reason}`);
    }
  }
}

import type { SetupDevOptions, UploadResult } from "../types";
import path from "node:path";
import { createLogger } from "#lib/logger";
import { createManifestTar, generateManifests } from "#lib/manifest";
import { uploadManifest, waitForUploadCompletion } from "#lib/upload";
import { getMonorepoRoot, parseVersions } from "#lib/utils";
import { unstable_startWorker } from "wrangler";

const logger = createLogger("setup-dev");

// Default versions to seed in local development
const DEV_VERSIONS = ["17.0.0", "16.0.0", "15.1.0", "15.0.0", "4.1.0", "4.0.0"];

export async function setupDev(options: SetupDevOptions): Promise<void> {
  const versions = parseVersions(options.versions) ?? DEV_VERSIONS;
  const batchSize = options.batchSize ?? 5;

  logger.info("Starting local development setup...");
  logger.info(`Seeding manifests for versions: ${versions.join(", ")}`);

  // Path to the API app's wrangler config and main worker entrypoint
  // Use monorepo root instead of process.cwd() for reliability
  const monorepoRoot = getMonorepoRoot();
  const apiRoot = path.join(monorepoRoot, "apps/api");

  // Start the real API worker (includes /_tasks routes)
  const worker = await unstable_startWorker({
    config: path.join(apiRoot, "./wrangler.jsonc"),
    entrypoint: path.join(apiRoot, "./src/index.ts"),
  });

  try {
    // Generate manifests
    const manifests = await generateManifests({
      versions,
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

    for (const manifest of manifests) {
      logger.info(`Creating tar archive for ${manifest.version}...`);
      const tar = createManifestTar(manifest);
      logger.info(`Tar archive size for ${manifest.version}: ${tar.byteLength} bytes`);

      try {
        logger.info(`Uploading ${manifest.version} to local tasks endpoint...`);
        const queued = await uploadToWorker(tar, manifest.version);
        logger.info(`Queued workflow ${queued.workflowId} for ${manifest.version}`);

        const completed = await waitForUploadOnWorker(queued.workflowId);
        logger.info(`Completed workflow ${queued.workflowId} for ${manifest.version} (${completed.status})`);

        result.uploaded += 1;
        result.versions.push({
          version: manifest.version,
          fileCount: manifest.fileCount,
        });
      } catch (err) {
        result.success = false;
        result.errors.push({
          version: manifest.version,
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }

    logger.info("Upload complete!");
    logger.info(`Uploaded ${result.uploaded} manifests:`);
    for (const v of result.versions) {
      logger.info(`  - ${v.version}: ${v.fileCount} expected files`);
    }
  } finally {
    await worker.dispose();
    logger.info("API worker disposed");
  }
}

async function uploadToWorker(
  tar: Uint8Array,
  version: string,
) {
  return uploadManifest(tar, version, {
    baseUrl: "http://127.0.0.1:8787",
  });
}

async function waitForUploadOnWorker(
  workflowId: string,
) {
  return waitForUploadCompletion(workflowId, {
    baseUrl: "http://127.0.0.1:8787",
  });
}

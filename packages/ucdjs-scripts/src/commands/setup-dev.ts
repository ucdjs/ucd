import type { SetupDevOptions, UploadResult } from "../types";
import path from "node:path";
import { createLogger } from "#lib/logger";
import { createManifestsTar, generateManifests } from "#lib/manifest";
import { parseVersions } from "#lib/utils";
import { unstable_startWorker } from "wrangler";

const logger = createLogger("setup-dev");

// Default versions to seed in local development
const DEV_VERSIONS = ["17.0.0", "16.0.0", "15.1.0", "15.0.0", "4.1.0", "4.0.0"];

export async function setupDev(options: SetupDevOptions): Promise<void> {
  const versions = parseVersions(options.versions) ?? DEV_VERSIONS;
  const batchSize = options.batchSize ?? 5;

  logger.info("Starting local development setup...");
  logger.info(`Seeding manifests for versions: ${versions.join(", ")}`);

  // Path to the API app's wrangler config and setup worker
  // Use cwd since this CLI is expected to run from the monorepo root
  // eslint-disable-next-line node/prefer-global/process
  const apiRoot = path.resolve(process.cwd(), "apps/api");

  // Start the setup worker
  const worker = await unstable_startWorker({
    config: path.join(apiRoot, "./wrangler.jsonc"),
    entrypoint: path.join(apiRoot, "./scripts/setup-dev/setup-worker.ts"),
  });

  try {
    // Generate manifests
    const manifests = await generateManifests({
      versions,
      batchSize,
    });

    logger.info(`Generated ${manifests.length} manifests`);

    // Create tar archive
    logger.info("Creating tar archive...");
    const tar = createManifestsTar(manifests);
    logger.info(`Tar archive size: ${tar.byteLength} bytes`);

    // Upload to local worker
    logger.info("Uploading manifests to local R2...");
    const result = await uploadToWorker(worker, tar);

    logger.info("Upload complete!");
    logger.info(`Uploaded ${result.uploaded} manifests:`);
    for (const v of result.versions) {
      logger.info(`  - ${v.version}: ${v.fileCount} expected files`);
    }
  } finally {
    await worker.dispose();
    logger.info("Setup worker disposed");
  }
}

/**
 * Upload manifests to the local wrangler worker.
 * Uses the worker's fetch directly since we can't use a URL with the unstable worker.
 */
async function uploadToWorker(
  worker: Awaited<ReturnType<typeof unstable_startWorker>>,
  tar: Uint8Array,
): Promise<UploadResult> {
  const response = await worker.fetch("https://api.ucdjs.dev/setup", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-tar",
    },
    body: tar,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  return (await response.json()) as UploadResult;
}

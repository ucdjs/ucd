import path from "node:path";
import { unstable_startWorker } from "wrangler";
import { createLogger } from "../lib/logger.js";
import { generateManifests } from "../lib/manifest.js";
import { createManifestsTar } from "../lib/tar.js";

const logger = createLogger("setup-dev");

// Default versions to seed in local development
const DEV_VERSIONS = ["17.0.0", "16.0.0", "15.1.0", "15.0.0", "4.1.0", "4.0.0"];

export interface SetupDevOptions {
  versions?: string;
  batchSize?: number;
  logLevel?: string;
}

export async function setupDev(options: SetupDevOptions): Promise<void> {
  const versions = options.versions
    ? options.versions.split(",").map((v) => v.trim())
    : DEV_VERSIONS;
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

    const result = (await response.json()) as {
      success: boolean;
      uploaded: number;
      versions: { version: string; fileCount: number }[];
    };

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

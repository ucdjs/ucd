import type { SetupDevOptions, UploadResult } from "../types";
import path from "node:path";
import { createLogger } from "#lib/logger";
import { generateManifests } from "#lib/manifest";
import { uploadManifest } from "#lib/upload";
import { getUpstreamVersions } from "#lib/upstream-versions";
import { getMonorepoRoot, parseVersions } from "#lib/utils";
import { unstable_startWorker } from "wrangler";

const logger = createLogger("setup-dev");

// Default versions to seed in local development
const DEV_VERSIONS = [
  "18.0.0",
  "17.0.0",
  "16.0.0",
  "15.1.0",
  "15.0.0",
  "4.1.0",
  "4.0.0",
  "3.0.0",
  "1.0.1",
];

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
    const upstreamVersions = await getUpstreamVersions();

    if (upstreamVersions.length === 0) {
      throw new Error("No upstream versions found - cannot proceed with setup");
    }

    // Generate manifests
    const manifests = await generateManifests({
      versions,
      upstreamVersions,
      batchSize,
    });

    logger.info(`Generated ${manifests.length} manifests`);

    const result: UploadResult = await uploadManifest(manifests, {
      baseUrl: "http://127.0.0.1:8787",
    });

    logger.info("Upload complete!");
    logger.info(`Uploaded ${result.uploaded} manifests:`);
    for (const v of result.versions) {
      logger.info(`  - ${v.version} [${v.status}] (${v.date ?? "unknown"}): ${v.fileCount} expected files`);
    }
  } finally {
    await worker.dispose();
    logger.info("API worker disposed");
  }
}

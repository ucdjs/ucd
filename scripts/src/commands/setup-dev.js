import path from "node:path";
import { CLI_NAME, parseCommand, parsePositiveInteger } from "#lib/command";
import { applyLogLevel, createLogger } from "#lib/logger";
import { createManifestTar, generateManifests } from "#lib/manifest";
import { uploadManifest, waitForUploadCompletion } from "#lib/upload";
import { getMonorepoRoot, parseVersions } from "#lib/utils";
import { unstable_startWorker } from "wrangler";

/**
 * @typedef {import("../types.js").SetupDevOptions} SetupDevOptions
 * @typedef {import("../types.js").UploadResult} UploadResult
 * @typedef {import("../lib/command.js").CommandDefinition} CommandDefinition
 */

const logger = createLogger("setup-dev");

const DEV_VERSIONS = ["17.0.0", "16.0.0", "15.1.0", "15.0.0", "4.1.0", "4.0.0"];

/**
 * @param {string[]} args
 * @returns {Promise<void>}
 */
export async function runSetupDevCommand(args) {
  const parsed = parseCommand(args, {
    usage: `$ ${CLI_NAME} setup-dev [options]`,
    description: "Seed local API environment with manifests.",
    options: {
      versions: {
        type: "string",
        valueName: "versions",
        description: "Comma-separated list of versions to seed (default: predefined dev list)",
      },
      "batch-size": {
        type: "string",
        valueName: "size",
        description: "Number of versions to fetch in parallel (default: 5)",
        transform: (value) => parsePositiveInteger(value, "--batch-size"),
      },
      "log-level": {
        type: "string",
        valueName: "level",
        description: "Set log level: debug|info|warn|error",
      },
    },
  });

  if (!parsed) {
    return;
  }

  /** @type {SetupDevOptions} */
  const options = {
    versions: /** @type {string | undefined} */ (parsed.values.versions),
    batchSize: /** @type {number | undefined} */ (parsed.values["batch-size"]),
    logLevel: /** @type {string | undefined} */ (parsed.values["log-level"]),
  };

  applyLogLevel(logger, options.logLevel);
  const versions = parseVersions(options.versions) ?? DEV_VERSIONS;
  const batchSize = options.batchSize ?? 5;

  logger.info("Starting local development setup...");
  logger.info(`Seeding manifests for versions: ${versions.join(", ")}`);

  const monorepoRoot = getMonorepoRoot();
  const apiRoot = path.join(monorepoRoot, "apps/api");

  const worker = await unstable_startWorker({
    config: path.join(apiRoot, "./wrangler.jsonc"),
    entrypoint: path.join(apiRoot, "./src/index.ts"),
  });

  try {
    const manifests = await generateManifests({
      versions,
      batchSize,
    });

    logger.info(`Generated ${manifests.length} manifests`);

    /** @type {UploadResult} */
    const result = {
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
      } catch (error) {
        result.success = false;
        result.errors.push({
          version: manifest.version,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info("Upload complete!");
    logger.info(`Uploaded ${result.uploaded} manifests:`);
    for (const version of result.versions) {
      logger.info(`  - ${version.version}: ${version.fileCount} expected files`);
    }
  } finally {
    await worker.dispose();
    logger.info("API worker disposed");
  }
}

/**
 * @param {Uint8Array} tar
 * @param {string} version
 * @returns {Promise<import("../types.js").TaskUploadQueuedResult>}
 */
async function uploadToWorker(tar, version) {
  return uploadManifest(tar, version, {
    baseUrl: "http://127.0.0.1:8787",
  });
}

/**
 * @param {string} workflowId
 * @returns {Promise<import("../types.js").TaskUploadStatusResult>}
 */
async function waitForUploadOnWorker(workflowId) {
  return waitForUploadCompletion(workflowId, {
    baseUrl: "http://127.0.0.1:8787",
  });
}

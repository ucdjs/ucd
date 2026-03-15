import { CLI_NAME, parseCommand, parsePositiveInteger } from "#lib/command";
import { resolveConfig } from "#lib/config";
import { applyLogLevel, createLogger } from "#lib/logger";
import { createManifestEtag, createManifestTar, generateManifests } from "#lib/manifest";
import { getRemoteManifestEtag, uploadManifest, waitForUploadCompletion } from "#lib/upload";
import { parseVersions } from "#lib/utils";

/**
 * @typedef {import("../types.js").RefreshManifestsOptions} RefreshManifestsOptions
 * @typedef {import("../types.js").GeneratedManifest} GeneratedManifest
 * @typedef {import("../types.js").UploadResult} UploadResult
 * @typedef {import("../lib/command.js").CommandDefinition} CommandDefinition
 */

const logger = createLogger("refresh-manifests");
const WEAK_ETAG_PREFIX_RE = /^W\//i;
const SURROUNDING_QUOTES_RE = /^"|"$/g;

/**
 * @typedef {object} QueuedUpload
 * @property {string} version
 * @property {number} fileCount
 * @property {string} workflowId
 */

/**
 * @param {string} etag
 * @returns {string}
 */
function normalizeEtag(etag) {
  return etag.trim().replace(WEAK_ETAG_PREFIX_RE, "").replace(SURROUNDING_QUOTES_RE, "");
}

/**
 * @param {string[]} args
 * @returns {Promise<void>}
 */
export async function runRefreshManifestsCommand(args) {
  const parsed = parseCommand(args, {
    usage: `$ ${CLI_NAME} refresh-manifests [options]`,
    description: "Generate manifests and upload changed versions to the target environment.",
    options: {
      env: {
        type: "string",
        valueName: "env",
        description: "Target environment: prod, preview, or local",
      },
      "base-url": {
        type: "string",
        valueName: "url",
        description: "Override base URL for upload",
      },
      "task-key": {
        type: "string",
        valueName: "key",
        description: "Secret key for authentication (X-UCDJS-Task-Key)",
      },
      versions: {
        type: "string",
        valueName: "versions",
        description: "Comma-separated list of versions (default: all from API)",
      },
      "dry-run": {
        type: "boolean",
        description: "Validate manifests without uploading",
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

  /** @type {RefreshManifestsOptions} */
  const options = {
    env: /** @type {string | undefined} */ (parsed.values.env),
    baseUrl: /** @type {string | undefined} */ (parsed.values["base-url"]),
    taskKey: /** @type {string | undefined} */ (parsed.values["task-key"]),
    versions: /** @type {string | undefined} */ (parsed.values.versions),
    dryRun: /** @type {boolean | undefined} */ (parsed.values["dry-run"]),
    batchSize: /** @type {number | undefined} */ (parsed.values["batch-size"]),
    logLevel: /** @type {string | undefined} */ (parsed.values["log-level"]),
  };

  applyLogLevel(logger, options.logLevel);
  await refreshManifests(options);
}

/**
 * @param {RefreshManifestsOptions} options
 * @returns {Promise<void>}
 */
export async function refreshManifests(options) {
  const versions = parseVersions(options.versions);
  const batchSize = options.batchSize ?? 5;
  const dryRun = options.dryRun ?? false;

  const config = resolveConfig({
    env: options.env,
    baseUrl: options.baseUrl,
    taskKey: options.taskKey,
  });

  logger.info(`Target: ${config.baseUrl}`);
  if (dryRun) {
    logger.info("Dry run mode enabled - no changes will be made");
  }

  logger.info("Generating manifests...");
  const manifests = await generateManifests({
    versions,
    apiBaseUrl: config.apiBaseUrl,
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

  if (dryRun) {
    logger.info("Dry run mode: generated manifests only. Skipping upload to tasks endpoint.");
    result.skipped = manifests.length;
    result.versions = manifests.map((manifest) => ({
      version: manifest.version,
      fileCount: manifest.fileCount,
    }));
  } else {
    const queuedUploads = await queueUploads(manifests, config.baseUrl, config.taskKey, result);
    await waitForQueuedUploads(queuedUploads, config.baseUrl, config.taskKey, result);
  }

  printResult(result, dryRun);
}

/**
 * @param {GeneratedManifest[]} manifests
 * @param {string} baseUrl
 * @param {string | undefined} taskKey
 * @param {UploadResult} result
 * @returns {Promise<QueuedUpload[]>}
 */
async function queueUploads(manifests, baseUrl, taskKey, result) {
  /** @type {QueuedUpload[]} */
  const queuedUploads = [];

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
    } catch (error) {
      pushUploadError(result, manifest.version, error);
    }
  }

  return queuedUploads;
}

/**
 * @param {QueuedUpload[]} queuedUploads
 * @param {string} baseUrl
 * @param {string | undefined} taskKey
 * @param {UploadResult} result
 * @returns {Promise<void>}
 */
async function waitForQueuedUploads(queuedUploads, baseUrl, taskKey, result) {
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
    } catch (error) {
      pushUploadError(result, queued.version, error);
    }
  }
}

/**
 * @param {UploadResult} result
 * @param {string} version
 * @param {unknown} error
 * @returns {void}
 */
function pushUploadError(result, version, error) {
  result.success = false;
  result.errors.push({
    version,
    reason: error instanceof Error ? error.message : String(error),
  });
}

/**
 * @param {UploadResult} result
 * @param {boolean} dryRun
 * @returns {void}
 */
function printResult(result, dryRun) {
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
    for (const version of result.versions) {
      lines.push(`  - ${version.version}: ${version.fileCount} expected files`);
    }
  }

  if (result.errors.length > 0) {
    lines.push("", "Errors:");
    for (const error of result.errors) {
      lines.push(`  - ${error.version}: ${error.reason}`);
    }
  }

  for (const line of lines) {
    logger.info(line);
  }
}

import type { RefreshManifestsOptions, UploadResult } from "../types";
import { resolveConfig } from "#lib/config";
import { createLogger } from "#lib/logger";
import { createManifestEtag, generateManifests } from "#lib/manifest";
import { getRemoteManifestEtag, uploadManifest } from "#lib/upload";
import { parseVersions } from "#lib/utils";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";

const logger = createLogger("refresh-manifests");
const WEAK_ETAG_PREFIX_RE = /^W\//i;
const SURROUNDING_QUOTES_RE = /^"|"$/g;

function normalizeEtag(etag: string): string {
  return etag.trim().replace(WEAK_ETAG_PREFIX_RE, "").replace(SURROUNDING_QUOTES_RE, "");
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

  let upstreamVersions;
  if (!versions) {
    upstreamVersions = UNICODE_VERSION_METADATA.map((version) => ({
      version: version.version,
      date: version.date,
      mappedUcdVersion: version.mappedUcdVersion ?? undefined,
      status: version.type,
    }));
    logger.info(`Resolved ${upstreamVersions.length} Unicode versions from @unicode-utils/core`);
  }

  // Generate manifests
  logger.info("Generating manifests...");
  const manifests = await generateManifests({
    versions,
    upstreamVersions,
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
    const uploadResult = await uploadManifest(manifests, {
      baseUrl: config.baseUrl,
      taskKey: config.taskKey,
      async shouldSkip(manifest) {
        const localEtag = createManifestEtag(manifest);
        const remoteEtag = await getRemoteManifestEtag(manifest.version, {
          baseUrl: config.baseUrl,
          taskKey: config.taskKey,
        });

        if (remoteEtag && normalizeEtag(remoteEtag) === normalizeEtag(localEtag)) {
          logger.info(`Skipping ${manifest.version}: no manifest changes detected (${localEtag})`);
          return true;
        }

        logger.info(
          remoteEtag
            ? `Uploading ${manifest.version}: manifest changed (${localEtag})`
            : `Uploading ${manifest.version}: remote manifest is missing or has no ETag`,
        );

        return false;
      },
    });

    result.success = uploadResult.success;
    result.uploaded = uploadResult.uploaded;
    result.skipped += uploadResult.skipped;
    result.errors = uploadResult.errors;
    result.versions = uploadResult.versions;
  }

  printResult(result, dryRun);
}

function applyDryRunResult(result: UploadResult, manifests: Awaited<ReturnType<typeof generateManifests>>): void {
  logger.info("Dry run mode: generated manifests only. Skipping upload to tasks endpoint.");
  result.skipped = manifests.length;
  result.versions = manifests.map((m) => ({
    version: m.version,
    date: m.date,
    status: m.status,
    fileCount: m.fileCount,
  }));
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
      lines.push(`  - ${v.version} [${v.status}] (${v.date ?? "unknown"}): ${v.fileCount} expected files`);
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

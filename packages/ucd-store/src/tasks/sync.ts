import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type {
  BaseOperationReport,
  InternalUCDStoreContext,
  ReportFile,
  SharedOperationOptions,
} from "../types";
import type { MirrorReport } from "./mirror";
import { prependLeadingSlash } from "@luxass/utils";
import {
  createConcurrencyLimiter,
  createDebugger,
  normalizePathForFiltering,
  wrapTry,
} from "@ucdjs-internal/shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import {
  readLockfileOrUndefined,
  readSnapshotOrUndefined,
  writeLockfile,
} from "@ucdjs/lockfile";
import { patheBasename } from "@ucdjs/path-utils";
import { isUCDStoreInternalContext } from "../context";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../errors";
import { listFiles } from "../files/list";
import { createEmptySummary } from "../utils/reports";
import { mirror } from "./mirror";

const debug = createDebugger("ucdjs:ucd-store:sync");

export interface SyncOptions extends SharedOperationOptions {
  /**
   * Specific versions to sync. If not provided, syncs all versions in lockfile.
   */
  versions?: string[];

  /**
   * Whether to re-download files even if they already exist locally.
   * @default false
   */
  force?: boolean;

  /**
   * Maximum concurrent downloads
   * @default 5
   */
  concurrency?: number;

  /**
   * Remove versions from lockfile that are not available in API.
   * @default false
   */
  removeUnavailable?: boolean;

  /**
   * Remove orphaned files (files not in expected files list for each version).
   * @default false
   */
  cleanOrphaned?: boolean;
}

/**
 * Complete sync report.
 * Extends BaseOperationReport for consistency with analyze/mirror.
 */
export interface SyncResult extends BaseOperationReport {
  /**
   * Versions that were added to the lockfile.
   */
  added: string[];

  /**
   * Versions that were removed from the lockfile (if removeUnavailable was true).
   */
  removed: string[];

  /**
   * Versions that were already in the lockfile.
   */
  unchanged: string[];

  /**
   * All versions in lockfile after sync.
   */
  versions: string[];

  /**
   * Report of mirrored files (same structure as mirror operation).
   * Always present (uses empty report when no mirroring occurred).
   */
  mirrorReport: MirrorReport;

  /**
   * Files that were removed per version (orphaned files, only if cleanOrphaned was true).
   * Always present (empty Map when no files removed).
   */
  removedFiles: Map<string, ReportFile[]>;
}

/**
 * Synchronizes the store lockfile with available versions from API and mirrors files.
 * Updates lockfile, downloads missing files, and optionally removes orphaned files/unavailable versions.
 *
 * @this {InternalUCDStoreContext} - Internal store context
 * @param {SyncOptions} [options] - Sync options
 * @returns {Promise<OperationResult<SyncResult, StoreError>>} Operation result
 */
async function _sync(
  this: InternalUCDStoreContext,
  options?: SyncOptions,
): Promise<OperationResult<SyncResult, StoreError>> {
  return wrapTry(async () => {
    const startTime = Date.now();

    if (!hasCapability(this.fs, ["mkdir", "write"])) {
      throw new UCDStoreGenericError("Filesystem does not support required write operations for syncing.");
    }

    const concurrency = options?.concurrency ?? 5;
    const force = options?.force ?? false;
    const removeUnavailable = options?.removeUnavailable ?? false;
    const cleanOrphaned = options?.cleanOrphaned ?? false;

    debug?.("Fetching available versions from API");
    const availableVersionsFromApi = await getVersionsFromApi(this);

    debug?.(`Found ${availableVersionsFromApi.length} available versions from API`);

    const lockfile = await readLockfileOrUndefined(this.fs, this.lockfile.path);
    const currentVersions = new Set(lockfile ? Object.keys(lockfile.versions) : []);

    const availableVersionsSet = new Set(availableVersionsFromApi);

    // If specific versions were requested, only consider those for adding
    // Otherwise, consider all available versions from the API
    const versionsToConsider = options?.versions && options.versions.length > 0
      ? options.versions.filter((v) => availableVersionsSet.has(v))
      : availableVersionsFromApi;

    // Validate that requested versions exist in API
    if (options?.versions && options.versions.length > 0) {
      const invalidVersions = options.versions.filter((v) => !availableVersionsSet.has(v));
      if (invalidVersions.length > 0) {
        // For backwards compatibility, throw UCDStoreVersionNotFoundError for single version
        if (invalidVersions.length === 1) {
          throw new UCDStoreVersionNotFoundError(invalidVersions[0]!);
        }

        throw new UCDStoreGenericError(
          `Requested versions are not available in API: ${invalidVersions.join(", ")}`,
        );
      }
    }

    const added = versionsToConsider.filter((v) => !currentVersions.has(v));

    const unchanged = Array.from(currentVersions).filter((v) => {
      // If the removeUnavailable is set to true, we will only keep the versions that
      // is available and already exist as unchanged. If the version is not available,
      // we will remove it from the unchanged list.

      if (removeUnavailable && !availableVersionsSet.has(v)) {
        return false;
      }

      if (!removeUnavailable) {
        return true;
      }

      return availableVersionsSet.has(v);
    });

    let removed: string[] = [];
    let finalVersions: string[];

    if (removeUnavailable) {
      // Remove versions not available in API
      removed = Array.from(currentVersions).filter((v) => !availableVersionsSet.has(v));
      // When removing unavailable, if specific versions were requested, use those + existing available
      // Otherwise use all available from API
      if (options?.versions && options.versions.length > 0) {
        finalVersions = [...new Set([...Array.from(currentVersions).filter((v) => availableVersionsSet.has(v)), ...versionsToConsider])];
      } else {
        finalVersions = availableVersionsFromApi;
      }
    } else {
      // Keep all existing versions + add new ones (only the requested or all available)
      finalVersions = [...new Set([...currentVersions, ...added])];
    }

    debug?.(
      `Lockfile update: ${added.length} added, ${removed.length} removed, ${unchanged.length} unchanged`,
    );

    // Step 4: Update lockfile
    if (lockfile || added.length > 0 || removed.length > 0) {
      // Preserve filters from existing lockfile or use current context filters
      const { extractFilterPatterns } = await import("../context");
      const filters = extractFilterPatterns(this.filter) ?? lockfile?.filters;
      const now = new Date();

      await writeLockfile(this.fs, this.lockfile.path, {
        lockfileVersion: 1,
        createdAt: lockfile?.createdAt ?? now,
        updatedAt: now,
        versions: Object.fromEntries(
          finalVersions.map((v) => {
            const existingEntry = lockfile?.versions[v];
            return [
              v,
              existingEntry ?? {
                path: `${v}/snapshot.json`, // relative path
                fileCount: 0,
                totalSize: 0,
                createdAt: now,
                updatedAt: now,
              },
            ];
          }),
        ),
        filters,
      });
    }

    // Step 5: Determine which versions to sync files for
    // Only mirror versions that need it: new versions or versions with no files (fileCount: 0)
    // Unless force is enabled, which re-downloads everything
    let versionsToSync: string[];
    if (options?.versions) {
      // User explicitly requested specific versions
      versionsToSync = options.versions;
    } else if (force) {
      // Force mode: re-mirror all versions
      versionsToSync = finalVersions;
    } else {
      // Default: only mirror versions that don't have files yet
      versionsToSync = finalVersions.filter((v) => {
        const entry = lockfile?.versions[v];
        // Mirror if no entry exists or fileCount is 0
        return !entry || entry.fileCount === 0;
      });
    }

    debug?.(`Determining versions to sync: ${versionsToSync.join(", ")}`);
    // Note: validation for specified versions happens earlier (line ~126)
    // where we check if requested versions exist in the API

    debug?.(`Validating versions to sync: ${versionsToSync.join(", ")}`);

    const emptyMirrorReport: MirrorReport = {
      timestamp: new Date().toISOString(),
      versions: new Map(),
      summary: createEmptySummary(0),
    };

    if (versionsToSync.length === 0) {
      debug?.("No versions to sync", { versionsToSync });
      const syncDuration = Date.now() - startTime;
      return {
        timestamp: new Date().toISOString(),
        added,
        removed,
        unchanged,
        versions: finalVersions,
        mirrorReport: emptyMirrorReport,
        removedFiles: new Map(),
        summary: createEmptySummary(syncDuration),
      };
    }

    debug?.(`Starting sync for ${versionsToSync.length} version(s) with concurrency=${concurrency}, force=${force}`);

    // Step 6: Mirror files for all versions
    const [mirrorReport, mirrorError] = await mirror(this, {
      versions: versionsToSync,
      force,
      concurrency,
      filters: options?.filters,
    });

    if (mirrorError) {
      throw mirrorError;
    }

    // Step 7: Remove orphaned files if cleanOrphaned flag is set
    const removedFiles = new Map<string, ReportFile[]>();

    if (cleanOrphaned) {
      const limit = createConcurrencyLimiter(concurrency);

      for (const version of versionsToSync) {
        // Get expected files from snapshot if available, otherwise from API
        let expectedFilesPaths: string[] = [];
        const snapshot = await readSnapshotOrUndefined(this.fs, version);

        if (snapshot && snapshot.files) {
          // Use files from snapshot (already normalized paths like "UnicodeData.txt")
          expectedFilesPaths = Object.keys(snapshot.files);
        } else {
          // Fallback to API - paths may include version/ucd prefix
          const apiExpectedFilesPaths = await this.getExpectedFilePaths(version);
          // Normalize paths to match listFiles output format (e.g., "UnicodeData.txt")
          expectedFilesPaths = apiExpectedFilesPaths.map((filePath) =>
            normalizePathForFiltering(version, filePath),
          );
        }

        // Apply filters
        const filteredExpectedFilesPaths = expectedFilesPaths.filter(
          (filePath) => this.filter(filePath, options?.filters),
        );

        const expectedFilesPathsSet = new Set(filteredExpectedFilesPaths);

        // Get all actual files
        const [actualFilesPaths, listFilesError] = await listFiles(this, version, {
          allowApi: false,
          filters: options?.filters,
        });

        if (listFilesError) {
          debug?.(`Failed to list files for version ${version} when checking orphaned files:`, listFilesError);
          continue;
        }

        console.error("Actual files for version", version, ":", actualFilesPaths);
        console.error("Expected files for version", version, ":", filteredExpectedFilesPaths);

        // Filter out snapshot.json from actual files (it's not a UCD data file)
        const filteredActualFiles = actualFilesPaths.filter((filePath) => !filePath.endsWith("snapshot.json"));

        // Find orphaned files (files not in expected files)
        const orphanedFiles = filteredActualFiles.filter((filePath) => !expectedFilesPathsSet.has(filePath));
        console.error("Orphaned files for version", version, ":", orphanedFiles);
        if (orphanedFiles.length > 0) {
          removedFiles.set(version, []);

          // Remove orphaned files
          await Promise.all(orphanedFiles.map((filePath) => limit(async () => {
            try {
              if (await this.fs.exists(filePath)) {
                await this.fs.rm!(filePath);
                removedFiles.get(version)!.push({
                  name: patheBasename(filePath),
                  filePath: prependLeadingSlash(filePath),
                });
                debug?.(`Removed orphaned file: ${filePath} for version ${version}`);
              }
            } catch (err) {
              debug?.(`Failed to remove orphaned file ${filePath} for version ${version}:`, err);
            }
          })));
        }
      }
    }

    const syncDuration = Date.now() - startTime;

    // Use mirror report's summary if available, otherwise create empty summary
    const summary = mirrorReport?.summary ?? createEmptySummary(syncDuration);
    // Update duration to reflect total sync time including orphan cleanup
    summary.duration = syncDuration;

    return {
      timestamp: new Date().toISOString(),
      added,
      removed,
      unchanged,
      versions: finalVersions,
      mirrorReport: mirrorReport ?? emptyMirrorReport,
      removedFiles,
      summary,
    };
  });
}

export function sync(
  context: InternalUCDStoreContext,
  options?: SyncOptions,
): Promise<OperationResult<SyncResult, StoreError>>;

export function sync(
  this: InternalUCDStoreContext,
  options?: SyncOptions,
): Promise<OperationResult<SyncResult, StoreError>>;

export function sync(
  this: InternalUCDStoreContext | void,
  thisOrContext?: InternalUCDStoreContext | SyncOptions,
  options?: SyncOptions,
): Promise<OperationResult<SyncResult, StoreError>> {
  if (isUCDStoreInternalContext(thisOrContext)) {
    // thisOrContext is the context
    return _sync.call(thisOrContext, options);
  }

  // 'this' is the context
  // 'thisOrContext' is actually the 'options'
  return _sync.call(
    this as InternalUCDStoreContext,
    thisOrContext as SyncOptions,
  );
}

async function getVersionsFromApi(context: InternalUCDStoreContext): Promise<string[]> {
  const configResult = await context.client.config.get();
  let availableVersionsFromApi: string[] = [];

  // If the response from config.get is not available, or is an error.
  // We can't proceed with the sync operation.
  if (configResult.error || !configResult.data) {
    // TODO: handle this error better.
    throw new Error("Failed to fetch versions from API");
  } else {
    availableVersionsFromApi = configResult.data.versions;
  }

  return availableVersionsFromApi;
}

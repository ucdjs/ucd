import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import type { MirrorReport } from "./mirror";
import {
  createConcurrencyLimiter,
  createDebugger,
  wrapTry,
} from "@ucdjs-internal/shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import {
  readLockfileOrDefault,
  readSnapshotOrDefault,
  writeLockfile,
} from "@ucdjs/lockfile";
import { join } from "pathe";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../errors";
import { listFiles } from "../files/list";
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

export interface SyncResult {
  timestamp: string;

  /**
   * Versions that were added to the lockfile
   */
  added: string[];

  /**
   * Versions that were removed from the lockfile (if removeUnavailable was true)
   */
  removed: string[];

  /**
   * Versions that were already in the lockfile
   */
  unchanged: string[];

  /**
   * All versions in lockfile after sync
   */
  versions: string[];

  /**
   * Report of mirrored files (same structure as mirror operation)
   */
  mirrorReport?: MirrorReport;

  /**
   * Files that were removed (orphaned files, only if cleanOrphaned was true)
   */
  removedFiles: Map<string, string[]>;
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

    const lockfile = await readLockfileOrDefault(this.fs, this.lockfile.path);
    const currentVersions = new Set(lockfile ? Object.keys(lockfile.versions) : []);

    const availableVersionsSet = new Set(availableVersionsFromApi);
    const added = availableVersionsFromApi.filter((v) => !currentVersions.has(v));

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
      finalVersions = availableVersionsFromApi; // Only keep versions available in API
    } else {
      // Keep all existing versions + add new ones
      finalVersions = [...currentVersions, ...added];
    }

    debug?.(
      `Lockfile update: ${added.length} added, ${removed.length} removed, ${unchanged.length} unchanged`,
    );

    // Step 4: Update lockfile
    if (lockfile || added.length > 0 || removed.length > 0) {
      // Preserve filters from existing lockfile or use current context filters
      const { extractFilterPatterns } = await import("../context");
      const filters = extractFilterPatterns(this.filter) ?? lockfile?.filters;

      await writeLockfile(this.fs, this.lockfile.path, {
        lockfileVersion: 1,
        versions: Object.fromEntries(
          finalVersions.map((v) => {
            const existingEntry = lockfile?.versions[v];
            return [
              v,
              existingEntry ?? {
                path: `${v}/snapshot.json`, // relative path
                fileCount: 0,
                totalSize: 0,
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
    // Validate specified versions exist in lockfile
    if (options?.versions && options.versions.length > 0) {
      debug?.(`Validating specified versions: ${options.versions.join(", ")}`);
      for (const version of options.versions) {
        if (!finalVersions.includes(version)) {
          throw new UCDStoreVersionNotFoundError(version);
        }
      }
    }

    debug?.(`Validating versions to sync: ${versionsToSync.join(", ")}`);

    if (versionsToSync.length === 0) {
      debug?.("No versions to sync", { versionsToSync });
      return {
        timestamp: new Date().toISOString(),
        added,
        removed,
        unchanged,
        versions: finalVersions,
        removedFiles: new Map(),
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
    const removedFiles = new Map<string, string[]>();

    if (cleanOrphaned) {
      const limit = createConcurrencyLimiter(concurrency);

      for (const version of versionsToSync) {
        // Get expected files from snapshot if available, otherwise from API
        let expectedFiles: string[] = [];
        const snapshot = await readSnapshotOrDefault(this.fs, this.basePath, version);

        if (snapshot && snapshot.files) {
          // Use files from snapshot
          expectedFiles = Object.keys(snapshot.files);
        } else {
          // Fallback to API
          expectedFiles = await this.getExpectedFilePaths(version);
        }

        // Apply filters
        const filteredExpectedFiles = expectedFiles.filter((filePath) =>
          this.filter(filePath, options?.filters),
        );

        const expectedFilesSet = new Set(filteredExpectedFiles);

        // Get all actual files
        const [actualFiles, listError] = await listFiles(this, version, {
          allowApi: false,
          filters: options?.filters,
        });

        if (listError) {
          debug?.(`Failed to list files for version ${version} when checking orphaned files:`, listError);
          continue;
        }

        // Find orphaned files (files not in expected files)
        const orphanedFiles = actualFiles.filter((filePath) => !expectedFilesSet.has(filePath));

        if (orphanedFiles.length > 0) {
          removedFiles.set(version, []);

          // Remove orphaned files
          await Promise.all(
            orphanedFiles.map((filePath) =>
              limit(async () => {
                try {
                  const localPath = join(this.basePath, version, filePath);
                  if (await this.fs.exists(localPath)) {
                    await this.fs.rm!(localPath);
                    removedFiles.get(version)!.push(filePath);
                    debug?.(`Removed orphaned file: ${filePath} for version ${version}`);
                  }
                } catch (err) {
                  debug?.(`Failed to remove orphaned file ${filePath} for version ${version}:`, err);
                }
              }),
            ),
          );
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      added,
      removed,
      unchanged,
      versions: finalVersions,
      mirrorReport,
      removedFiles,
    };
  });
}

function isContext(obj: any): obj is InternalUCDStoreContext {
  return !!obj && typeof obj === "object" && Array.isArray(obj.versions?.resolved);
}

export function sync(
  context: InternalUCDStoreContext,
  options?: SyncOptions,
): Promise<OperationResult<SyncResult, StoreError>>;

export function sync(
  this: InternalUCDStoreContext,
  options?: SyncOptions,
): Promise<OperationResult<SyncResult, StoreError>>;

export function sync(this: any, thisOrContext: any, options?: any): Promise<OperationResult<SyncResult, StoreError>> {
  if (isContext(thisOrContext)) {
    return _sync.call(thisOrContext, options);
  }

  return _sync.call(this, thisOrContext);
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

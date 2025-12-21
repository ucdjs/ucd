import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import type { MirrorReport } from "./mirror";
import {
  createConcurrencyLimiter,
  createDebugger,
  tryCatch,
} from "@ucdjs-internal/shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import { join } from "pathe";
import { getExpectedFilePaths } from "../core/files";
import { readLockfileOrDefault, readSnapshotOrDefault, writeLockfile } from "../core/lockfile";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../errors";
import { listFiles } from "./files/list";
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
 * @param {InternalUCDStoreContext} context - Internal store context
 * @param {SyncOptions} [options] - Sync options
 * @returns {Promise<OperationResult<SyncResult, StoreError>>} Operation result
 */
export async function sync(
  context: InternalUCDStoreContext,
  options?: SyncOptions,
): Promise<OperationResult<SyncResult, StoreError>> {
  return tryCatch(async () => {
    if (!hasCapability(context.fs, ["mkdir", "write"])) {
      throw new UCDStoreGenericError("Filesystem does not support required write operations for syncing.");
    }

    const concurrency = options?.concurrency ?? 5;
    const force = options?.force ?? false;
    const removeUnavailable = options?.removeUnavailable ?? false;
    const cleanOrphaned = options?.cleanOrphaned ?? false;

    // Step 1: Fetch available versions from API
    debug?.("Fetching available versions from API");
    const configResult = await context.client.config.get();
    let availableVersions: string[] = [];

    if (configResult.error || !configResult.data) {
      // Fallback to versions.list() if config is not available
      const apiResult = await context.client.versions.list();
      if (apiResult.error) throw apiResult.error;
      if (!apiResult.data) {
        throw new UCDStoreGenericError("Failed to fetch Unicode versions: no data returned");
      }
      availableVersions = apiResult.data.map(({ version }) => version);
    } else {
      // Use versions from config
      availableVersions = configResult.data.versions ?? [];
      if (availableVersions.length === 0) {
        // Fallback if config doesn't have versions array
        const apiResult = await context.client.versions.list();
        if (apiResult.error) throw apiResult.error;
        if (!apiResult.data) {
          throw new UCDStoreGenericError("Failed to fetch Unicode versions: no data returned");
        }
        availableVersions = apiResult.data.map(({ version }) => version);
      }
    }

    debug?.(`Found ${availableVersions.length} available versions from API`);

    // Step 2: Read current lockfile
    const lockfile = await readLockfileOrDefault(context.fs, context.lockfilePath);
    const currentVersions = new Set(lockfile ? Object.keys(lockfile.versions) : []);

    // Step 3: Determine which versions to add/remove/keep
    const availableVersionsSet = new Set(availableVersions);
    const added = availableVersions.filter((v) => !currentVersions.has(v));
    const unchanged = Array.from(currentVersions).filter((v) => availableVersionsSet.has(v));

    let removed: string[] = [];
    let finalVersions: string[];

    if (removeUnavailable) {
      // Remove versions not available in API
      removed = Array.from(currentVersions).filter((v) => !availableVersionsSet.has(v));
      finalVersions = availableVersions; // Only keep versions available in API
    } else {
      // Keep all existing versions + add new ones
      finalVersions = [...currentVersions, ...added];
    }

    debug?.(
      `Lockfile update: ${added.length} added, ${removed.length} removed, ${unchanged.length} unchanged`,
    );

    // Step 4: Update lockfile
    if (lockfile || added.length > 0 || removed.length > 0) {
      await writeLockfile(context.fs, context.lockfilePath, {
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
      });
    }

    // Step 5: Determine which versions to sync files for
    const versionsToSync = options?.versions ?? finalVersions;

    // Validate specified versions exist in lockfile
    if (options?.versions && options.versions.length > 0) {
      for (const version of options.versions) {
        if (!finalVersions.includes(version)) {
          throw new UCDStoreVersionNotFoundError(version);
        }
      }
    }

    if (versionsToSync.length === 0) {
      debug?.("No versions to sync");
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
    const [mirrorReport, mirrorError] = await mirror(context, {
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
        const snapshot = await readSnapshotOrDefault(context.fs, context.basePath, version);

        if (snapshot && snapshot.files) {
          // Use files from snapshot
          expectedFiles = Object.keys(snapshot.files);
        } else {
          // Fallback to API
          expectedFiles = await getExpectedFilePaths(context.client, version);
        }

        // Apply filters
        const filteredExpectedFiles = expectedFiles.filter((filePath) =>
          context.filter(filePath, options?.filters),
        );

        const expectedFilesSet = new Set(filteredExpectedFiles);

        // Get all actual files
        const [actualFiles, listError] = await listFiles(context, version, {
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
                  const localPath = join(context.basePath, version, filePath);
                  if (await context.fs.exists(localPath)) {
                    await context.fs.rm!(localPath);
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

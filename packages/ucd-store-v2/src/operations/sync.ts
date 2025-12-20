import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext } from "../types";
import type { MirrorReport } from "./mirror";
import { tryCatch } from "@ucdjs-internal/shared";
import { readLockfileOrDefault, writeLockfile } from "../core/lockfile";
import { mirror } from "./mirror";

export interface SyncOptions {
  /**
   * Whether to automatically mirror files after syncing versions.
   * @default false
   */
  mirror?: boolean;

  /**
   * Strategy for handling version updates
   * - "add": Only add new versions (keep existing)
   * - "update": Add new, remove unavailable versions
   * @default "add"
   */
  strategy?: "add" | "update";
}

export interface SyncResult {
  timestamp: string;

  /**
   * Versions that were added to the lockfile
   */
  added: string[];

  /**
   * Versions that were removed from the lockfile (if strategy: "update")
   */
  removed: string[];

  /**
   * Versions that were already in the lockfile
   */
  unchanged: string[];

  /**
   * Current versions in the lockfile after sync
   */
  versions: string[];

  /**
   * Report of mirrored versions (if mirroring was performed)
   */
  mirrored?: MirrorReport;
}

/**
 * Synchronizes the store lockfile with available versions from ucd-config.json.
 * Updates which versions the store knows about (metadata-level operation).
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
    const strategy = options?.strategy ?? "add";
    const shouldMirror = options?.mirror ?? false;

    // Get available versions from config (via client.config.get())
    const configResult = await context.client.config.get();
    let availableVersions: string[] = [];

    if (configResult.error || !configResult.data) {
      // Fallback to versions.list() if config is not available
      const apiResult = await context.client.versions.list();
      if (apiResult.error) throw apiResult.error;
      if (!apiResult.data) {
        throw new Error("Failed to fetch Unicode versions: no data returned");
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
          throw new Error("Failed to fetch Unicode versions: no data returned");
        }
        availableVersions = apiResult.data.map(({ version }) => version);
      }
    }

    const lockfile = await readLockfileOrDefault(context.fs, context.lockfilePath);
    const currentVersions = new Set(lockfile ? Object.keys(lockfile.versions) : []);
    const apiVersions = new Set(availableVersions);

    const added: string[] = [];
    const removed: string[] = [];
    const unchanged: string[] = [];

    // Find added versions (in API/config but not in lockfile)
    for (const version of apiVersions) {
      if (!currentVersions.has(version)) {
        added.push(version);
      }
    }

    // Find unchanged versions based on strategy
    if (strategy === "add") {
      // All current versions are unchanged (kept)
      unchanged.push(...currentVersions);
    } else {
      // Only versions in both API/config and lockfile are unchanged
      for (const version of currentVersions) {
        if (apiVersions.has(version)) {
          unchanged.push(version);
        }
      }
    }

    // For "update" strategy, find removed versions (in lockfile but not in API/config)
    if (strategy === "update") {
      for (const version of currentVersions) {
        if (!apiVersions.has(version)) {
          removed.push(version);
        }
      }
    }

    // Determine versions based on strategy
    let finalVersions: string[];
    if (strategy === "add") {
      // Keep all existing versions and add new ones
      finalVersions = [...currentVersions, ...added];
    } else {
      // Use only API/config versions (removes unavailable versions)
      finalVersions = [...apiVersions];
    }

    // Update lockfile with final versions
    await writeLockfile(
      context.fs,
      context.lockfilePath,
      {
        lockfileVersion: 1,
        versions: Object.fromEntries(
          finalVersions.map((v) => {
            const existingEntry = lockfile?.versions[v];
            return [
              v,
              existingEntry ?? {
                path: `v${v}/snapshot.json`, // relative path
                fileCount: 0,
                totalSize: 0,
              },
            ];
          }),
        ),
      },
    );

    const result: SyncResult = {
      timestamp: new Date().toISOString(),
      added,
      removed,
      unchanged,
      versions: finalVersions,
    };

    // If we should mirror new versions
    if (shouldMirror && added.length > 0) {
      const [mirrorReport, mirrorErr] = await mirror(context, {
        versions: added,
      });

      if (mirrorErr) throw mirrorErr;
      result.mirrored = mirrorReport;
    }

    return result;
  });
}

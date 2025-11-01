import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext } from "../types";
import type { MirrorReport } from "./mirror";
import { tryCatch } from "@ucdjs-internal/shared";
import { readManifest, writeManifest } from "../core/manifest";
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
   * Versions that were added to the manifest
   */
  added: string[];

  /**
   * Versions that were removed from the manifest (if strategy: "update")
   */
  removed: string[];

  /**
   * Versions that were already in the manifest
   */
  unchanged: string[];

  /**
   * Current versions in the manifest after sync
   */
  versions: string[];

  /**
   * Report of mirrored versions (if mirroring was performed)
   */
  mirrored?: MirrorReport;
}

/**
 * Synchronizes the store manifest with available versions from the API.
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

    const apiResult = await context.client.versions.list();
    if (apiResult.error) throw apiResult.error;
    if (!apiResult.data) {
      throw new Error("Failed to fetch Unicode versions: no data returned");
    }

    const availableVersions = apiResult.data.map(({ version }) => version);

    const manifest = await readManifest(context.fs, context.manifestPath);

    const currentVersions = new Set(Object.keys(manifest));
    const apiVersions = new Set(availableVersions);

    const added: string[] = [];
    const removed: string[] = [];
    const unchanged: string[] = [];

    // Find added versions (in API but not in manifest)
    for (const version of apiVersions) {
      if (!currentVersions.has(version)) {
        added.push(version);
      } else {
        unchanged.push(version);
      }
    }

    // For "update" strategy, find removed versions (in manifest but not in API)
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
      // Use only API versions (removes unavailable versions)
      finalVersions = [...apiVersions];
    }

    await writeManifest(context.fs, context.manifestPath, finalVersions);

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

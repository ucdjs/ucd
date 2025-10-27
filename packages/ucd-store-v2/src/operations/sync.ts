import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext } from "../types";
import { tryCatch } from "@ucdjs-internal/shared";
import { readManifest } from "../core/manifest";

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
   * Mirror result if mirror: true was used
   */
  mirrored?: {
    success: string[];
    failed: string[];
  };
}

/**
 * Synchronizes the store manifest with available versions from the API.
 * Updates which versions the store knows about (metadata-level operation).
 *
 * @param {InternalUCDStoreContext} context - Internal store context
 * @param {SyncOptions} [_options] - Sync options
 * @returns {Promise<OperationResult<SyncResult, StoreError>>} Operation result
 */
export async function sync(
  context: InternalUCDStoreContext,
  _options?: SyncOptions,
): Promise<OperationResult<SyncResult, StoreError>> {
  return tryCatch(async () => {
    const [availableVersions, err] = await context.client.versions.list();
    if (err) throw err;

    const manifest = readManifest(context.fs, context.manifestPath);

    // TODO: Implement sync operation
    // 1. Fetch available versions from API
    // 2. Read current manifest
    // 3. Determine added/removed/unchanged based on strategy
    // 4. Update manifest with new versions
    // 5. If options.mirror is true, call mirror() for new versions
    // 6. Return SyncResult

    const result: SyncResult = {
      timestamp: new Date().toISOString(),
      added: [],
      removed: [],
      unchanged: [],
      versions: context.versions,
    };

    return result;
  });
}

import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import {
  createDebugger,
  filterTreeStructure,
  flattenFilePaths,
  wrapTry,
} from "@ucdjs-internal/shared";
import { isUCDStoreInternalContext } from "../context";
import { UCDStoreApiFallbackError, UCDStoreVersionNotFoundError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:files:list");

export interface ListFilesOptions extends SharedOperationOptions {
  /**
   * Whether to allow falling back to API if files are not found in local store
   * @default false
   */
  allowApi?: boolean;
}

/**
 * Lists all file paths for a Unicode version. The operation prefers the
 * configured file system bridge and can optionally fall back to the API when
 * the bridge path is missing or cannot be read.
 *
 * Behavior
 * - Throws `UCDStoreVersionNotFoundError` when the requested version is not
 *   part of the resolved store versions.
 * - When the bridge directory for the version exists, returns flattened file
 *   paths filtered with global filters plus any `options.filters`. If listing
 *   fails and `allowApi` is true, it falls back to the API; otherwise it
 *   returns an empty array.
 * - When the bridge directory does not exist, it returns an empty array unless
 *   `allowApi` is true, in which case it fetches the file tree from the API
 *   and applies the same filtering before flattening.
 *
 * @this {InternalUCDStoreContext} - Internal store context with client, filters, FS bridge, and configuration
 * @param version Unicode version to list files for (must be resolved in the store)
 * @param options Optional filters and `allowApi` fallback behavior
 * @returns Operation result containing filtered, flattened file paths or an error
 */
async function _listFiles(
  this: InternalUCDStoreContext,
  version: string,
  options?: ListFilesOptions,
): Promise<OperationResult<string[], StoreError>> {
  return wrapTry(async () => {
    // Validate version exists in store
    if (!this.versions.resolved.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    // Use relative path
    const localPath = version;
    // Try listing from local store first
    const dirExists = await this.fs.exists(localPath);

    if (dirExists) {
      try {
        const entries = await this.fs.listdir(localPath, true);
        const filteredEntries = filterTreeStructure(this.filter, entries, options?.filters);

        return flattenFilePaths(filteredEntries);
      } catch (err) {
        debug?.("Failed to list local directory:", localPath, err);

        // If allowApi is false, return empty array
        if (!options?.allowApi) {
          return [];
        }
      }
    }

    // If directory doesn't exist and allowApi is false, return empty array
    if (!options?.allowApi) {
      debug?.("Directory does not exist locally and allowApi is false:", localPath);
      return [];
    }

    debug?.("Fetching file tree from API for version:", version);
    const result = await this.client.versions.getFileTree(version);

    if (result.error) {
      throw new UCDStoreApiFallbackError({
        version,
        filePath: "file-tree",
        reason: "fetch-failed",
        status: result.error.status,
      });
    }

    if (result.data == null) {
      throw new UCDStoreApiFallbackError({
        version,
        filePath: "file-tree",
        reason: "no-data",
      });
    }

    const entries = filterTreeStructure(
      this.filter,
      result.data,
      options?.filters,
    );

    return flattenFilePaths(entries);
  });
}

export function listFiles(
  context: InternalUCDStoreContext,
  version: string,
  options?: ListFilesOptions,
): Promise<OperationResult<string[], StoreError>>;

export function listFiles(
  this: InternalUCDStoreContext,
  version: string,
  options?: ListFilesOptions,
): Promise<OperationResult<string[], StoreError>>;

export function listFiles(
  this: InternalUCDStoreContext | void,
  thisOrContext: InternalUCDStoreContext | string,
  versionOrOptions?: string | ListFilesOptions,
  options?: ListFilesOptions,
): Promise<OperationResult<string[], StoreError>> {
  if (isUCDStoreInternalContext(thisOrContext)) {
    return _listFiles.call(
      thisOrContext,
      versionOrOptions as string,
      options,
    );
  }

  // 'thisOrContext' is the version, 'versionOrOptions' is the options
  return _listFiles.call(
    this as InternalUCDStoreContext,
    thisOrContext as string,
    versionOrOptions as ListFilesOptions,
  );
}

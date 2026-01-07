import type { OperationResult } from "@ucdjs-internal/shared";
import type { UnicodeFileTreeNode } from "@ucdjs/schemas";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import {
  createDebugger,
  filterTreeStructure,
  wrapTry,
} from "@ucdjs-internal/shared";
import { isUCDStoreInternalContext } from "../context";
import { UCDStoreApiFallbackError, UCDStoreVersionNotFoundError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:files:tree");

export interface GetFileTreeOptions extends SharedOperationOptions {
  /**
   * Whether to allow falling back to API if files are not found in local store
   * @default false
   */
  allowApi?: boolean;
}

/**
 * Retrieves the file tree for a specific Unicode version from the local store.
 * By default, only returns the tree structure for files actually present in the store.
 * Applies global filters and optional method-specific filters to the tree.
 *
 * @this {InternalUCDStoreContext} - Internal store context with client, filters, FS bridge, and configuration
 * @param {string} version - The Unicode version to fetch the file tree for
 * @param {GetFileTreeOptions} [options] - Optional filters and API fallback behavior
 * @returns {Promise<OperationResult<UnicodeFileTreeNode[], StoreError>>} Operation result with filtered file tree or error
 */
async function _getFileTree(
  this: InternalUCDStoreContext,
  version: string,
  options?: GetFileTreeOptions,
): Promise<OperationResult<UnicodeFileTreeNode[], StoreError>> {
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

        const filteredTree = filterTreeStructure(this.filter, entries, {
          exclude: options?.filters?.exclude,
          include: options?.filters?.include,
        });

        return filteredTree;
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

    // Fetch file tree from API
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

    const filteredTree = filterTreeStructure(this.filter, result.data, {
      exclude: options?.filters?.exclude,
      include: options?.filters?.include,
    });

    return filteredTree;
  });
}

export function getFileTree(
  context: InternalUCDStoreContext,
  version: string,
  options?: GetFileTreeOptions,
): Promise<OperationResult<UnicodeFileTreeNode[], StoreError>>;

export function getFileTree(
  this: InternalUCDStoreContext,
  version: string,
  options?: GetFileTreeOptions,
): Promise<OperationResult<UnicodeFileTreeNode[], StoreError>>;

export function getFileTree(
  this: InternalUCDStoreContext | void,
  thisOrContext: InternalUCDStoreContext | string,
  versionOrOptions?: string | GetFileTreeOptions,
  options?: GetFileTreeOptions,
): Promise<OperationResult<UnicodeFileTreeNode[], StoreError>> {
  if (isUCDStoreInternalContext(thisOrContext)) {
    return _getFileTree.call(
      thisOrContext,
      versionOrOptions as string,
      options,
    );
  }

  // 'thisOrContext' is the version string
  // 'versionOrOptions' is the options object
  return _getFileTree.call(
    this as InternalUCDStoreContext,
    thisOrContext as string,
    versionOrOptions as GetFileTreeOptions,
  );
}

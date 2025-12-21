import type { OperationResult } from "@ucdjs-internal/shared";
import type { UnicodeTreeNode } from "@ucdjs/schemas";
import type { StoreError } from "../../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../../types";
import {
  createDebugger,
  filterTreeStructure,
  tryCatch,
} from "@ucdjs-internal/shared";
import { join } from "pathe";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../errors";

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
 * @param {InternalUCDStoreContext} context - Internal store context with client, filters, and configuration
 * @param {string} version - The Unicode version to fetch the file tree for
 * @param {GetFileTreeOptions} [options] - Optional filters and API fallback behavior
 * @returns {Promise<OperationResult<UnicodeTreeNode[], StoreError>>} Operation result with filtered file tree or error
 */
export async function getFileTree(
  context: InternalUCDStoreContext,
  version: string,
  options?: GetFileTreeOptions,
): Promise<OperationResult<UnicodeTreeNode[], StoreError>> {
  return tryCatch(async () => {
    // Validate version exists in store
    if (!context.versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    const localPath = join(context.basePath, `v${version}`);

    // Try listing from local store first
    const dirExists = await context.fs.exists(localPath);

    if (dirExists) {
      try {
        const entries = await context.fs.listdir(localPath, true);

        const filteredTree = filterTreeStructure(context.filter, entries, {
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
    const result = await context.client.versions.getFileTree(version);

    if (result.error) {
      throw new UCDStoreGenericError(
        `Failed to fetch file tree for version '${version}': ${result.error.message}`,
        { version, status: result.error.status },
      );
    }

    if (result.data == null) {
      throw new UCDStoreGenericError(
        `Failed to fetch file tree for version '${version}': no data returned`,
        { version },
      );
    }

    const filteredTree = filterTreeStructure(context.filter, result.data, {
      exclude: options?.filters?.exclude,
      include: options?.filters?.include,
    });

    return filteredTree;
  });
}

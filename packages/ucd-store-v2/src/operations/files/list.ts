import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../../types";
import {
  createDebugger,
  filterTreeStructure,
  flattenFilePaths,
  tryCatch,
} from "@ucdjs-internal/shared";
import { join } from "pathe";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../errors";

const debug = createDebugger("ucdjs:ucd-store:files:list");

export interface ListFilesOptions extends SharedOperationOptions {
  /**
   * Whether to allow falling back to API if files are not found in local store
   * @default false
   */
  allowApi?: boolean;
}

/**
 * Retrieves all file paths for a specific Unicode version from the local store,
 * with optional fallback to the API when allowApi is enabled.
 * By default, only lists files that are actually present in the local store.
 * Flattens the file tree and applies global filters and optional method-specific filters.
 *
 * @param {InternalUCDStoreContext} context - Internal store context with client, filters, and configuration
 * @param {string} version - The Unicode version to list files for
 * @param {ListFilesOptions} [options] - Optional filters and API fallback behavior
 * @returns {Promise<OperationResult<string[], StoreError>>} Operation result with filtered file paths or error
 */
export async function listFiles(
  context: InternalUCDStoreContext,
  version: string,
  options?: ListFilesOptions,
): Promise<OperationResult<string[], StoreError>> {
  return tryCatch(async () => {
    // Validate version exists in store
    if (!context.versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    const localPath = join(context.basePath, version);

    // Try listing from local store first
    const dirExists = await context.fs.exists(localPath);

    if (dirExists) {
      try {
        const entries = await context.fs.listdir(localPath, true);

        const filteredEntries = filterTreeStructure(context.filter, entries, options?.filters);

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

    const entries = filterTreeStructure(
      context.filter,
      result.data,
      options?.filters,
    );

    return flattenFilePaths(entries);
  });
}

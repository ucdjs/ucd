import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../../types";
import {
  flattenFilePaths,
  tryCatch,
} from "@ucdjs-internal/shared";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../errors";

/**
 * Retrieves all file paths for a specific Unicode version from the API.
 * Flattens the file tree and applies global filters and optional method-specific filters.
 *
 * @param {InternalUCDStoreContext} context - Internal store context with client, filters, and configuration
 * @param {string} version - The Unicode version to fetch file paths for
 * @param {SharedOperationOptions} [options] - Optional filters to apply on top of global filters
 * @returns {Promise<OperationResult<string[], StoreError>>} Operation result with filtered file paths or error
 */
export async function listFiles(
  context: InternalUCDStoreContext,
  version: string,
  options?: SharedOperationOptions,
): Promise<OperationResult<string[], StoreError>> {
  return tryCatch(async () => {
    // validate version exists in store
    if (!context.versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    // Fetch file tree from API
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

    // flatten tree to paths
    const allPaths = flattenFilePaths(result.data);

    // apply filters to paths (global filters + optional method-specific filters)
    const filteredPaths = allPaths.filter((path) => context.filter(path, options?.filters));

    return filteredPaths;
  });
}

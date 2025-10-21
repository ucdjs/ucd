import type { OperationResult } from "@ucdjs-internal/shared";
import type { UnicodeTreeNode } from "@ucdjs/schemas";
import type { StoreError } from "../../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../../types";
import {
  filterTreeStructure,
  tryCatch,
} from "@ucdjs-internal/shared";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../errors";

/**
 * Retrieves the file tree for a specific Unicode version from the API.
 * Applies global filters and optional method-specific filters to the tree.
 *
 * @param {InternalUCDStoreContext} context - Internal store context with client, filters, and configuration
 * @param {string} version - The Unicode version to fetch the file tree for
 * @param {SharedOperationOptions} [options] - Optional filters to apply on top of global filters
 * @returns {Promise<OperationResult<UnicodeTreeNode[], StoreError>>} Operation result with filtered file tree or error
 */
export async function getFileTree(
  context: InternalUCDStoreContext,
  version: string,
  options?: SharedOperationOptions,
): Promise<OperationResult<UnicodeTreeNode[], StoreError>> {
  return tryCatch(async () => {
    // validate version exists in store
    if (!context.versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    // fetch file tree from API
    const result = await context.client.versions.getFileTree(version);

    if (result.error) {
      throw new UCDStoreGenericError(
        `Failed to fetch file tree for version '${version}': ${result.error.message}`,
        { version, status: result.error.status },
      );
    }

    if (!result.data) {
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

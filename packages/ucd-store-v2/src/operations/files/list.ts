import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../../types";
import {
  createDebugger,
  filterTreeStructure,
  flattenFilePaths,
  wrapTry,
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
 * @param context Internal store context with client, filters, and configuration
 * @param version Unicode version to list files for (must be resolved in the store)
 * @param options Optional filters and `allowApi` fallback behavior
 * @returns Operation result containing filtered, flattened file paths or an error
 */
export async function listFiles(
  context: InternalUCDStoreContext,
  version: string,
  options?: ListFilesOptions,
): Promise<OperationResult<string[], StoreError>> {
  return wrapTry(async () => {
    // Validate version exists in store
    if (!context.versions.resolved.includes(version)) {
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

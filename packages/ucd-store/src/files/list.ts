import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import type { OperationResult } from "@ucdjs-internal/shared";
import type { FSEntry } from "@ucdjs/fs-bridge";
import {
  createDebugger,
  filterTreeStructure,
  flattenFilePaths,
  normalizeTreeForFiltering,
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
 * Build a lookup of normalized paths to original paths.
 * This allows us to filter using normalized paths but return original paths.
 */
function buildPathMapping(
  version: string,
  originalEntries: FSEntry[],
  normalizedEntries: FSEntry[],
): Map<string, string> {
  const originalPaths = flattenFilePaths(originalEntries);
  const normalizedPaths = flattenFilePaths(normalizedEntries);

  const mapping = new Map<string, string>();

  // Both arrays should be in the same order since normalizeTreeForFiltering

  // preserves structure
  for (let i = 0; i < normalizedPaths.length; i++) {
    const normalizedPath = normalizedPaths[i];
    const originalPath = originalPaths[i];
    if (normalizedPath && originalPath) {
      mapping.set(normalizedPath, originalPath);
    }
  }

  return mapping;
}

/**
 * Lists all file paths for a Unicode version. The operation prefers the
 * configured file system bridge and can optionally fall back to the API when
 * the bridge path is missing or cannot be read.
 *
 * Returns full paths (e.g., "/16.0.0/UnicodeData.txt"), not just filenames.
 *
 * @this {InternalUCDStoreContext} - Internal store context
 * @param version Unicode version to list files for
 * @param options Optional filters and `allowApi` fallback behavior
 * @returns Operation result containing full file paths or an error
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

    // Use simple version path - both node and HTTP bridges use the same structure
    // The store subdomain handles /ucd/ internally
    const filesPath = version;

    debug?.("Using files path:", filesPath, "for version:", version);

    // Try listing from the store first
    const dirExists = await this.fs.exists(filesPath);

    if (dirExists) {
      try {
        const entries = await this.fs.listdir(filesPath, true);

        debug?.("Listed entries from store for version:", version);

        // Normalize for filtering (strips version/ucd prefix)
        const normalizedEntries = normalizeTreeForFiltering(version, entries);

        // Build mapping from normalized -> original paths
        const pathMapping = buildPathMapping(version, entries, normalizedEntries);

        // Filter using normalized paths
        const filteredEntries = filterTreeStructure(
          this.filter,
          normalizedEntries,
          options?.filters,
        );

        // Get normalized paths that passed filtering
        const filteredNormalizedPaths = flattenFilePaths(filteredEntries);

        // Map back to original paths
        const originalPaths = filteredNormalizedPaths.map((normalizedPath) => {
          const original = pathMapping.get(normalizedPath);
          if (!original) {
            // Fallback: construct the path if mapping fails
            return `/${version}/${normalizedPath.replace(/^\/+/, "")}`;
          }
          return original;
        });

        debug?.("Listed %d files from store for version: %s", originalPaths.length, version);

        return originalPaths;
      } catch (err) {
        debug?.("Failed to list directory:", filesPath, err);

        if (!options?.allowApi) {
          return [];
        }
      }
    }

    // If directory doesn't exist and allowApi is false, return empty array
    if (!options?.allowApi) {
      debug?.("Directory does not exist and allowApi is false:", filesPath);
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

    // Build mapping from normalized -> original paths
    const normalizedTree = normalizeTreeForFiltering(version, result.data);
    const pathMapping = buildPathMapping(version, result.data, normalizedTree);

    // Filter using normalized paths
    const filteredEntries = filterTreeStructure(
      this.filter,
      normalizedTree,
      options?.filters,
    );

    // Get normalized paths that passed filtering
    const filteredNormalizedPaths = flattenFilePaths(filteredEntries);

    // Map back to original paths
    return filteredNormalizedPaths.map((normalizedPath) => {
      const original = pathMapping.get(normalizedPath);
      if (!original) {
        return `/${version}/${normalizedPath.replace(/^\/+/, "")}`;
      }
      return original;
    });
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

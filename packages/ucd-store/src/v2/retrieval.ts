import type { OperationResult } from "@ucdjs-internal/shared";
import type { FileSystemBridge, OptionalCapabilityKey } from "@ucdjs/fs-bridge";
import type { UnicodeTreeNode } from "@ucdjs/schemas";
import type { StoreError } from "../errors";
import type { GetFileOptions, InternalUCDStoreContext, StoreMethodOptions, UCDStoreMethods } from "./types";
import {
  createDebugger,
  filterTreeStructure,
  flattenFilePaths,
} from "@ucdjs-internal/shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import { join } from "pathe";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:v2:retrieval");

/**
 * Retrieves the file tree for a specific Unicode version from the API.
 * Applies global filters and optional method-specific filters to the tree.
 *
 * @param context - Internal store context with client, filters, and configuration
 * @param version - The Unicode version to fetch the file tree for
 * @param options - Optional filters to apply on top of global filters
 * @returns Operation result with filtered file tree or error
 */
export async function getFileTree(
  context: InternalUCDStoreContext,
  version: string,
  options?: StoreMethodOptions,
): Promise<OperationResult<UnicodeTreeNode[], StoreError>> {
  try {
    // Validate version exists in store
    if (!context.versions.includes(version)) {
      return [null, new UCDStoreVersionNotFoundError(version)];
    }

    // Fetch file tree from API
    const result = await context.client.versions.getFileTree(version);

    if (result.error) {
      return [
        null,
        new UCDStoreGenericError(
          `Failed to fetch file tree for version '${version}': ${result.error.message}`,
          { version, status: result.error.status },
        ),
      ];
    }

    if (!result.data) {
      return [
        null,
        new UCDStoreGenericError(
          `Failed to fetch file tree for version '${version}': no data returned`,
          { version },
        ),
      ];
    }

    const filteredTree = filterTreeStructure(context.filter, result.data, {
      exclude: options?.filters?.exclude,
      include: options?.filters?.include,
    });

    return [filteredTree, null];
  } catch (error) {
    return [
      null,
      error instanceof Error
        ? new UCDStoreGenericError(error.message, { version })
        : new UCDStoreGenericError("Unknown error occurred", { version }),
    ];
  }
}

/**
 * Retrieves all file paths for a specific Unicode version from the API.
 * Flattens the file tree and applies global filters and optional method-specific filters.
 *
 * @param context - Internal store context with client, filters, and configuration
 * @param version - The Unicode version to fetch file paths for
 * @param options - Optional filters to apply on top of global filters
 * @returns Operation result with filtered file paths or error
 */
export async function getFilePaths(
  context: InternalUCDStoreContext,
  version: string,
  options?: StoreMethodOptions,
): Promise<OperationResult<string[], StoreError>> {
  try {
    // Validate version exists in store
    if (!context.versions.includes(version)) {
      return [null, new UCDStoreVersionNotFoundError(version)];
    }

    // Fetch file tree from API
    const result = await context.client.versions.getFileTree(version);

    if (result.error) {
      return [
        null,
        new UCDStoreGenericError(
          `Failed to fetch file tree for version '${version}': ${result.error.message}`,
          { version, status: result.error.status },
        ),
      ];
    }

    if (!result.data) {
      return [
        null,
        new UCDStoreGenericError(
          `Failed to fetch file tree for version '${version}': no data returned`,
          { version },
        ),
      ];
    }

    // Flatten tree to paths
    const allPaths = flattenFilePaths(result.data);

    // Apply filters to paths (global filters + optional method-specific filters)
    const filteredPaths = allPaths.filter((path) => context.filter(path, options?.filters));

    return [filteredPaths, null];
  } catch (error) {
    return [
      null,
      error instanceof Error
        ? new UCDStoreGenericError(error.message, { version })
        : new UCDStoreGenericError("Unknown error occurred", { version }),
    ];
  }
}

/**
 * Retrieves a specific file for a Unicode version.
 * First attempts to read from local file system, then falls back to API if not found.
 * Optionally caches the file to local FS after fetching from API.
 *
 * @param context - Internal store context with client, filters, FS bridge, and configuration
 * @param version - The Unicode version containing the file
 * @param filePath - The path to the file within the version
 * @param options - Optional filters and cache behavior
 * @returns Operation result with file content or error
 */
export async function getFile(
  context: InternalUCDStoreContext,
  version: string,
  filePath: string,
  options?: GetFileOptions,
): Promise<OperationResult<string, StoreError>> {
  try {
    // Validate version exists in store
    if (!context.versions.includes(version)) {
      return [null, new UCDStoreVersionNotFoundError(version)];
    }

    // Check if file passes filters (global filters + optional method-specific filters)
    if (!context.filter(filePath, options?.filters)) {
      return [
        null,
        new UCDStoreGenericError(
          `File '${filePath}' does not pass filters`,
          { version, filePath },
        ),
      ];
    }

    // Construct local path
    const localPath = join(context.basePath, version, filePath);

    // Try reading from local FS first
    const fileExists = await context.fs.exists(localPath);

    if (fileExists) {
      try {
        const content = await context.fs.read(localPath);
        return [content, null];
      } catch {
        // If read fails, fall through to fetch from API
        debug?.("Failed to read local file, fetching from API:", localPath);
      }
    }

    // Fetch from API
    const remotePath = join(version, filePath);
    const result = await context.client.files.get(remotePath);

    if (result.error) {
      return [
        null,
        new UCDStoreGenericError(
          `Failed to fetch file '${filePath}': ${result.error.message}`,
          { version, filePath, status: result.error.status },
        ),
      ];
    }

    if (!result.data) {
      return [
        null,
        new UCDStoreGenericError(
          `Failed to fetch file '${filePath}': no data returned`,
          { version, filePath },
        ),
      ];
    }

    // handle both string and JSON responses
    let content: string;
    if (typeof result.data === "string") {
      content = result.data;
    } else {
      content = JSON.stringify(result.data, null, 2);
    }

    // cache to local FS if available and not disabled
    const shouldCache = options?.cache !== false;
    if (shouldCache && hasCapability(context.fs, "write")) {
      try {
        await context.fs.write(localPath, content);
        debug?.("Cached file to local FS:", localPath);
      } catch (error) {
        // cache failure is not critical, just log it
        debug?.("Failed to cache file:", error);
      }
    }

    return [content, null];
  } catch (error) {
    return [
      null,
      error instanceof Error
        ? new UCDStoreGenericError(error.message, { version, filePath })
        : new UCDStoreGenericError("Unknown error occurred", { version, filePath }),
    ];
  }
}

/**
 * Creates the store methods object by binding the internal context to each retrieval function.
 * This wires up the public API methods (getFileTree, getFilePaths, getFile) to their implementations.
 *
 * @param context - Internal store context with client, filters, FS bridge, and configuration
 * @returns Object with bound store methods ready to be exposed on the store instance
 */
export function createStoreMethods(context: InternalUCDStoreContext): UCDStoreMethods {
  return {
    getFileTree: (version, options) => getFileTree(context, version, options),
    getFilePaths: (version, options) => getFilePaths(context, version, options),
    getFile: (version, filePath, options) => getFile(context, version, filePath, options),
  };
}

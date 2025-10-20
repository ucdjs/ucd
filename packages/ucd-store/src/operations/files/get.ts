import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../../types";
import { createDebugger, tryCatch } from "@ucdjs-internal/shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import { join } from "pathe";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../errors";

/**
 * Options for the getFile method
 */
export interface GetFileOptions extends SharedOperationOptions {
  /**
   * Whether to cache the file to local FS if available
   * @default true
   */
  cache?: boolean;
}

const debug = createDebugger("ucdjs:ucd-store:files:get");

/**
 * Retrieves a specific file for a Unicode version.
 * First attempts to read from local file system, then falls back to API if not found.
 * Optionally caches the file to local FS after fetching from API.
 *
 * @param {InternalUCDStoreContext} context - Internal store context with client, filters, FS bridge, and configuration
 * @param {string} version - The Unicode version containing the file
 * @param {string} filePath - The path to the file within the version
 * @param {GetFileOptions} [options] - Optional filters and cache behavior
 * @returns {Promise<OperationResult<string, StoreError>>} Operation result with file content or error
 */
export async function getFile(
  context: InternalUCDStoreContext,
  version: string,
  filePath: string,
  options?: GetFileOptions,
): Promise<OperationResult<string, StoreError>> {
  return tryCatch(async () => {
    // validate version exists in store
    if (!context.versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    // check if file passes filters (global filters + optional method-specific filters)
    if (!context.filter(filePath, options?.filters)) {
      throw new UCDStoreGenericError(
        `File '${filePath}' does not pass filters`,
        { version, filePath },
      );
    }

    // construct local path
    const localPath = join(context.basePath, version, filePath);

    // try reading from local FS first
    const fileExists = await context.fs.exists(localPath);

    if (fileExists) {
      try {
        const content = await context.fs.read(localPath);
        return content;
      } catch {
        // If read fails, fall through to fetch from API
        debug?.("Failed to read local file, fetching from API:", localPath);
      }
    }

    // fetch from API
    const remotePath = join(version, filePath);
    const result = await context.client.files.get(remotePath);

    if (result.error) {
      throw new UCDStoreGenericError(
        `Failed to fetch file '${filePath}': ${result.error.message}`,
        { version, filePath, status: result.error.status },
      );
    }

    if (!result.data) {
      throw new UCDStoreGenericError(
        `Failed to fetch file '${filePath}': no data returned`,
        { version, filePath },
      );
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

    return content;
  });
}

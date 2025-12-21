import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../../types";
import { createDebugger, tryCatch } from "@ucdjs-internal/shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import { join } from "pathe";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../errors";

const debug = createDebugger("ucdjs:ucd-store:files:get");

export interface GetFileOptions extends SharedOperationOptions {
  /**
   * Whether to cache the file to local FS if available
   *
   * NOTE:
   * This requires that `allowApi` is enabled and that the FS bridge has write capability.
   *
   * @default true
   */
  cache?: boolean;

  /**
   * Whether to allow falling back to API if file is not found in local store
   * @default false
   */
  allowApi?: boolean;
}

/**
 * Retrieves a specific file for a Unicode version from the local store.
 * By default, only reads files that are actually present in the store.
 * Optionally caches the file to local FS after fetching from API (if allowApi is enabled).
 *
 * @param {InternalUCDStoreContext} context - Internal store context with client, filters, FS bridge, and configuration
 * @param {string} version - The Unicode version containing the file
 * @param {string} filePath - The path to the file within the version
 * @param {GetFileOptions} [options] - Optional filters, cache behavior, and API fallback
 * @returns {Promise<OperationResult<string, StoreError>>} Operation result with file content or error
 */
export async function getFile(
  context: InternalUCDStoreContext,
  version: string,
  filePath: string,
  options?: GetFileOptions,
): Promise<OperationResult<string, StoreError>> {
  return tryCatch(async () => {
    // Validate version exists in store
    if (!context.versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    // Check if file passes filters (global filters + optional method-specific filters)
    if (!context.filter(filePath, options?.filters)) {
      throw new UCDStoreGenericError(
        `File '${filePath}' does not pass filters`,
        { version, filePath },
      );
    }

    const localPath = join(context.basePath, `v${version}`, filePath);

    const fileExists = await context.fs.exists(localPath);

    if (fileExists) {
      try {
        const content = await context.fs.read(localPath);
        return content;
      } catch (err) {
        debug?.("Failed to read local file:", localPath, err);

        if (!options?.allowApi) {
          throw new UCDStoreGenericError(
            `Failed to read file '${filePath}' from local store`,
            { version, filePath },
          );
        }
      }
    }

    // If file doesn't exist and allowApi is false, throw error
    if (!options?.allowApi) {
      throw new UCDStoreGenericError(
        `File '${filePath}' does not exist in local store`,
        { version, filePath },
      );
    }

    debug?.("Fetching file from API:", filePath);
    const remotePath = join(version, filePath);
    const result = await context.client.files.get(remotePath);

    if (result.error) {
      throw new UCDStoreGenericError(
        `Failed to fetch file '${filePath}': ${result.error.message}`,
        { version, filePath, status: result.error.status },
      );
    }

    if (result.data == null) {
      throw new UCDStoreGenericError(
        `Failed to fetch file '${filePath}': no data returned`,
        { version, filePath },
      );
    }

    // Handle both string and JSON responses
    let content: string;
    if (typeof result.data === "string") {
      content = result.data;
    } else {
      content = JSON.stringify(result.data);
    }

    // Cache to local FS if available and not disabled
    const shouldCache = options?.cache !== false;
    if (shouldCache && hasCapability(context.fs, "write")) {
      try {
        await context.fs.write(localPath, content);
        debug?.("Cached file to local FS:", localPath);
      } catch (err) {
        debug?.("Failed to cache file:", err);
      }
    }

    return content;
  });
}

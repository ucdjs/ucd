import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../../types";
import { createDebugger, tryOr, wrapTry } from "@ucdjs-internal/shared";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { join } from "pathe";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../errors";

const debug = createDebugger("ucdjs:ucd-store:files:get");

export interface GetFileOptions extends SharedOperationOptions {
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
  return wrapTry(async () => {
    // Validate version exists in store
    if (!context.versions.resolved.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    // Check if file passes filters (global filters + optional method-specific filters)
    if (!context.filter(filePath, options?.filters)) {
      debug?.("File '%s' does not pass filters", filePath);
      throw new UCDStoreGenericError(
        `File '${filePath}' does not pass filters`,
        { version, filePath },
      );
    }

    const localPath = join(context.basePath, version, filePath);

    debug?.("Checking local file existence:", localPath);

    const fileExists = await context.fs.exists(localPath);

    if (fileExists) {
      debug?.("Local file exists:", localPath);
      const content = await tryOr({
        try: context.fs.read(localPath),
        err: (err) => {
          debug?.("Failed to read local file:", localPath, err);

          if (!options?.allowApi) {
            throw new UCDStoreGenericError(
              `Failed to read file '${filePath}' from local store`,
              { version, filePath },
            );
          }
        },
      });

      if (content != null) {
        debug?.("Returning local file content:", localPath);
        return content;
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

    // Note:
    // The store always uses `<version>/ucd/<file>` paths when fetching from API,
    // because the Unicode database also includes e.g. `<version>/ucdxml/<file>`,
    // which is _not_ part of the store. Paths returned from the API are
    // relative to their containing folder and do not include the `ucd` segment.
    // By adding `ucd` here, we ensure consistency with the mirror operation.
    const remotePath = join(version, hasUCDFolderPath(version) ? "ucd" : "", filePath);
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

    return content;
  });
}

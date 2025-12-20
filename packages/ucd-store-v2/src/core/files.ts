import type { UCDClient } from "@ucdjs/client";
import { createDebugger, flattenFilePaths } from "@ucdjs-internal/shared";
import { UCDStoreGenericError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:files");

/**
 * Retrieves the expected file paths for a specific Unicode version from the API.
 *
 * This method first attempts to fetch from the version-specific manifest endpoint
 * (/.well-known/ucd-store/{version}.json) for better performance. If that fails,
 * it falls back to fetching the file tree and flattening it.
 *
 * The returned file paths represent the complete set of files that should be present
 * in a properly synchronized store for the specified version.
 *
 * @param {UCDClient} client - The UCD client instance for making API requests
 * @param {string} version - The Unicode version to get expected file paths for
 * @returns {Promise<string[]>} A promise that resolves to an array of file paths that should exist for the version
 *
 * @throws {UCDStoreGenericError} When both API requests fail or return errors
 */
export async function getExpectedFilePaths(
  client: UCDClient,
  version: string,
): Promise<string[]> {
  debug?.("Fetching expected file paths for version:", version);

  // Try version-specific manifest endpoint first (more efficient)
  const manifestResult = await client.manifest.get(version);

  if (!manifestResult.error && manifestResult.data?.expectedFiles) {
    debug?.("Successfully fetched expected files from version manifest endpoint");
    return manifestResult.data.expectedFiles;
  }

  debug?.("Version manifest endpoint failed, falling back to file tree:", manifestResult.error?.message);

  // Fallback to file tree endpoint
  const result = await client.versions.getFileTree(version);

  if (result.error) {
    throw new UCDStoreGenericError(
      `Failed to fetch expected files for version '${version}': ${result.error.message}`,
      { version, status: result.error.status },
    );
  }

  if (!result.data) {
    throw new UCDStoreGenericError(
      `Failed to fetch expected files for version '${version}': empty response`,
      { version },
    );
  }

  debug?.("Successfully fetched expected files from file tree endpoint");
  return flattenFilePaths(result.data);
}

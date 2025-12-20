import type { UCDClient } from "@ucdjs/client";
import { UCDStoreGenericError } from "../errors";

/**
 * Retrieves the expected file paths for a specific Unicode version from the API.
 *
 * This method fetches the canonical list of files that should exist for a given
 * Unicode version by making an API call to the per-version manifest endpoint.
 * The returned file paths represent the complete set of files that should be
 * present in a properly synchronized store for the specified version.
 *
 * @param {UCDClient} client - The UCD client instance for making API requests
 * @param {string} version - The Unicode version to get expected file paths for
 * @returns {Promise<string[]>} A promise that resolves to an array of file paths that should exist for the version
 *
 * @throws {UCDStoreGenericError} When the API request fails or returns an error
 */
export async function getExpectedFilePaths(
  client: UCDClient,
  version: string,
): Promise<string[]> {
  // Fetch the expected files for this version from the per-version manifest endpoint
  const result = await client.manifest.get(version);

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

  return result.data.expectedFiles;
}

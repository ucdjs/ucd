import type { UCDClient } from "@ucdjs/fetch";
import { isApiError } from "@ucdjs/fetch";
import { flattenFilePaths } from "@ucdjs/shared";
import { UCDStoreGenericError } from "../errors";

/**
 * Retrieves the expected file paths for a specific Unicode version from the API.
 *
 * This method fetches the canonical list of files that should exist for a given
 * Unicode version by making an API call to the UCD service. The returned file
 * paths represent the complete set of files that should be present in a properly
 * synchronized store for the specified version.
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
  // fetch the expected files for this version from the API
  const { data, error } = await client.GET("/api/v1/versions/{version}/file-tree", {
    params: {
      path: {
        version,
      },
    },
  });

  if (error != null) {
    if (!isApiError(error)) {
      throw new UCDStoreGenericError(
        `Failed to fetch expected files for version '${version}': ${error}`,
        { version },
      );
    }

    throw new UCDStoreGenericError(
      `Failed to fetch expected files for version '${version}': ${error.message}`,
      { version, status: error.status },
    );
  }

  if (data == null) {
    throw new UCDStoreGenericError(
      `Failed to fetch expected files for version '${version}': empty response`,
      { version },
    );
  }

  return flattenFilePaths(data);
}

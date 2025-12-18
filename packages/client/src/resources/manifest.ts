import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import { customFetch } from "@ucdjs-internal/shared";

/**
 * Regex pattern for validating Unicode version format (X.Y.Z)
 * Compiled once at module load for better performance
 */
const VERSION_FORMAT_REGEX = /^\d+\.\d+\.\d+$/;

/**
 * Response type for per-version manifest endpoint
 * Matches the schema from /.well-known/ucd-store/{version}.json
 */
export interface VersionManifestResponse {
  /**
   * List of expected file paths for this version
   */
  expectedFiles: string[];
}

export interface ManifestResource {
  /**
   * Get the manifest for a specific Unicode version
   * @param {string} version - The Unicode version (e.g., "16.0.0")
   * @returns {Promise<SafeFetchResponse<VersionManifestResponse>>} The manifest containing expectedFiles
   */
  get: (version: string) => Promise<SafeFetchResponse<VersionManifestResponse>>;
}

export interface CreateManifestResourceOptions {
  baseUrl: string;
}

export function createManifestResource(options: CreateManifestResourceOptions): ManifestResource {
  const { baseUrl } = options;

  return {
    async get(version: string) {
      // Validate version format (optional, API also validates)
      if (!VERSION_FORMAT_REGEX.test(version)) {
        return {
          error: new Error(`Invalid version format: ${version}. Expected X.Y.Z format.`),
          data: null,
        };
      }

      const url = new URL(`/.well-known/ucd-store/${version}.json`, baseUrl);
      return customFetch.safe<VersionManifestResponse>(url.toString(), {
        parseAs: "json",
      });
    },
  };
}

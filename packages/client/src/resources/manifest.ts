import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { UCDStoreVersionManifest } from "@ucdjs/schemas";
import { customFetch } from "@ucdjs-internal/shared";
import { UCDStoreVersionManifestSchema } from "@ucdjs/schemas";

/**
 * Regex pattern for validating Unicode version format (X.Y.Z)
 * Compiled once at module load for better performance
 */
const VERSION_FORMAT_REGEX = /^\d+\.\d+\.\d+$/;

export interface ManifestResource {
  /**
   * Get the manifest for a specific Unicode version
   * @param {string} version - The Unicode version (e.g., "16.0.0")
   * @returns {Promise<SafeFetchResponse<UCDStoreVersionManifest>>} The manifest containing expectedFiles
   */
  get: (version: string) => Promise<SafeFetchResponse<UCDStoreVersionManifest>>;
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
      return customFetch.safe<UCDStoreVersionManifest>(url.toString(), {
        parseAs: "json",
        schema: UCDStoreVersionManifestSchema,
      });
    },
  };
}

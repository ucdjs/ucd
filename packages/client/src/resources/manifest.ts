import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { UCDStoreVersionManifest } from "@ucdjs/schemas";

export interface ManifestResource {
  /**
   * Get the manifest for a specific Unicode version.
   *
   * @deprecated Use `client.versions.getManifest(version)` instead.
   *
   * @param {string} version - The Unicode version (e.g., "16.0.0")
   * @returns {Promise<SafeFetchResponse<UCDStoreVersionManifest>>} The manifest containing expectedFiles
   */
  get: (version: string) => Promise<SafeFetchResponse<UCDStoreVersionManifest>>;
}

export interface CreateManifestResourceOptions {
  getManifest: (version: string) => Promise<SafeFetchResponse<UCDStoreVersionManifest>>;
}

export function createManifestResource(options: CreateManifestResourceOptions): ManifestResource {
  // TODO(luxass): Remove this deprecated resource once callers have migrated
  // to `client.versions.getManifest(version)`.
  return {
    get(version: string) {
      return options.getManifest(version);
    },
  };
}

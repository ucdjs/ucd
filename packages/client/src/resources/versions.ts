import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type {
  UCDStoreVersionManifest,
  UCDWellKnownConfig,
  UnicodeVersionDetails,
} from "@ucdjs/schemas";
import type { paths } from "../.generated/api";
import { customFetch } from "@ucdjs-internal/shared";
import {
  UCDStoreVersionManifestSchema,
  UnicodeFileTreeSchema,
  UnicodeVersionDetailsSchema,
  UnicodeVersionListSchema,
} from "@ucdjs/schemas";

type VersionsListResponse = paths["/api/v1/versions"]["get"]["responses"][200]["content"]["application/json"];
type VersionDetailsResponse = UnicodeVersionDetails;
type FileTreeResponse = paths["/api/v1/versions/{version}/file-tree"]["get"]["responses"][200]["content"]["application/json"];
const VERSION_FORMAT_REGEX = /^\d+\.\d+\.\d+$/;

export interface VersionsResource {
  /**
   * List all available Unicode versions
   * @return {Promise<SafeFetchResponse<VersionsListResponse>>} An array of available Unicode version strings
   */
  list: () => Promise<SafeFetchResponse<VersionsListResponse>>;

  /**
   * Get details for a specific Unicode version
   *
   * @param {string} version - The Unicode version (e.g., "16.0.0")
   * @returns {Promise<SafeFetchResponse<VersionDetailsResponse>>} Version metadata and statistics
   */
  get: (version: string) => Promise<SafeFetchResponse<VersionDetailsResponse>>;

  /**
   * Get the file tree for a specific Unicode version
   *
   * @param {string} version - The Unicode version (e.g., "16.0.0")
   * @returns {Promise<SafeFetchResponse<FileTreeResponse>>} The file tree structure for the specified version
   */
  getFileTree: (version: string) => Promise<SafeFetchResponse<FileTreeResponse>>;

  /**
   * Get the manifest for a specific Unicode version
   *
   * @param {string} version - The Unicode version (e.g., "16.0.0")
   * @returns {Promise<SafeFetchResponse<UCDStoreVersionManifest>>} The manifest for the specified version
   */
  getManifest: (version: string) => Promise<SafeFetchResponse<UCDStoreVersionManifest>>;
}

export interface CreateVersionsResourceOptions {
  baseUrl: string;
  endpoints: UCDWellKnownConfig["endpoints"];
}

export function createVersionsResource(options: CreateVersionsResourceOptions): VersionsResource {
  const { baseUrl, endpoints } = options;

  return {
    async list() {
      const url = new URL(endpoints.versions, baseUrl);

      return customFetch.safe<VersionsListResponse, "json">(url.toString(), {
        parseAs: "json",
        schema: UnicodeVersionListSchema,
      });
    },

    async get(version: string) {
      const url = new URL(`${endpoints.versions}/${version}`, baseUrl);

      return customFetch.safe<VersionDetailsResponse, "json">(url.toString(), {
        parseAs: "json",
        schema: UnicodeVersionDetailsSchema,
      });
    },

    async getFileTree(version: string) {
      const url = new URL(`${endpoints.versions}/${version}/file-tree`, baseUrl);

      return customFetch.safe<FileTreeResponse, "json">(url.toString(), {
        parseAs: "json",
        schema: UnicodeFileTreeSchema,
      });
    },

    async getManifest(version: string) {
      if (!VERSION_FORMAT_REGEX.test(version)) {
        return {
          error: new Error(`Invalid version format: ${version}. Expected X.Y.Z format.`),
          data: null,
        };
      }

      const manifestPath = endpoints.manifest.replace("{version}", version);
      const url = new URL(manifestPath, baseUrl);

      return customFetch.safe<UCDStoreVersionManifest, "json">(url.toString(), {
        parseAs: "json",
        schema: UCDStoreVersionManifestSchema,
      });
    },
  };
}

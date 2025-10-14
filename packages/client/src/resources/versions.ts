import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import type { paths } from "../.generated/api";
import { customFetch } from "@ucdjs-internal/shared";

type VersionsListResponse = paths["/api/v1/versions"]["get"]["responses"][200]["content"]["application/json"];
type FileTreeResponse = paths["/api/v1/versions/{version}/file-tree"]["get"]["responses"][200]["content"]["application/json"];

export interface VersionsResource {
  /**
   * List all available Unicode versions
   * @return {Promise<SafeFetchResponse<VersionsListResponse>>} An array of available Unicode version strings
   */
  list: () => Promise<SafeFetchResponse<VersionsListResponse>>;

  /**
   * Get the file tree for a specific Unicode version
   *
   * @param {string} version - The Unicode version (e.g., "16.0.0")
   * @returns {Promise<SafeFetchResponse<FileTreeResponse>>} The file tree structure for the specified version
   */
  getFileTree: (version: string) => Promise<SafeFetchResponse<FileTreeResponse>>;
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
      });
    },

    async getFileTree(version: string) {
      const url = new URL(`${endpoints.versions}/${version}/file-tree`, baseUrl);

      return customFetch.safe<FileTreeResponse, "json">(url.toString(), {
        parseAs: "json",
      });
    },
  };
}

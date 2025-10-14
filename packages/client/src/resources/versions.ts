import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { paths } from "../.generated/api";
import { customFetch } from "@ucdjs-internal/shared";

type VersionsListResponse = paths["/api/v1/versions"]["get"]["responses"][200]["content"]["application/json"];
type FileTreeResponse = paths["/api/v1/versions/{version}/file-tree"]["get"]["responses"][200]["content"]["application/json"];

export interface VersionsResource {
  /**
   * List all available Unicode versions
   */
  list: () => Promise<SafeFetchResponse<VersionsListResponse>>;

  /**
   * Get the file tree for a specific Unicode version
   *
   * @param version - The Unicode version (e.g., "16.0.0")
   */
  getFileTree: (version: string) => Promise<SafeFetchResponse<FileTreeResponse>>;
}

export interface CreateVersionsResourceOptions {
  baseUrl: string;
  versionsPath: string;
}

export function createVersionsResource(options: CreateVersionsResourceOptions): VersionsResource {
  const { baseUrl, versionsPath } = options;

  return {
    async list() {
      const url = new URL(versionsPath, baseUrl);

      return customFetch.safe<VersionsListResponse, "json">(url.toString(), {
        parseAs: "json",
      });
    },

    async getFileTree(version: string) {
      const url = new URL(`${versionsPath}/${version}/file-tree`, baseUrl);

      return customFetch.safe<FileTreeResponse, "json">(url.toString(), {
        parseAs: "json",
      });
    },
  };
}

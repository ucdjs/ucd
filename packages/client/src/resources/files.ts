import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import type { paths } from "../.generated/api";
import { customFetch } from "@ucdjs-internal/shared";

type ManifestResponse = paths["/api/v1/files/.ucd-store.json"]["get"]["responses"][200]["content"]["application/json"];
type FileResponse = paths["/api/v1/files/{wildcard}"]["get"]["responses"][200]["content"];

export interface FilesResource {
  /**
   * Get a file or directory listing from the Unicode data
   *
   * @param {string} path - The path to the file (e.g., "16.0.0/ucd/UnicodeData.txt")
   * @returns {Promise<SafeFetchResponse<string | FileResponse["application/json"]>>} File content as text, JSON, or other format depending on the file type
   */
  get: (path: string) => Promise<SafeFetchResponse<FileResponse[keyof FileResponse]>>;

  /**
   * Get the UCD manifest file containing metadata about available files
   * @returns {Promise<SafeFetchResponse<ManifestResponse>>} The UCD manifest file content
   */
  getManifest: () => Promise<SafeFetchResponse<ManifestResponse>>;
}

export interface CreateFilesResourceOptions {
  baseUrl: string;
  endpoints: UCDWellKnownConfig["endpoints"];
}

export function createFilesResource(options: CreateFilesResourceOptions): FilesResource {
  const { baseUrl, endpoints } = options;

  return {
    async get(path: string) {
      const url = new URL(`${endpoints.files}/${path}`, baseUrl);

      return customFetch.safe(url.toString());
    },

    async getManifest() {
      const url = new URL(endpoints.manifest, baseUrl);

      return customFetch.safe<ManifestResponse>(url.toString(), {
        parseAs: "json",
      });
    },
  };
}

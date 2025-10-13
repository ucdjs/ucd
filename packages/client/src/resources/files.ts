import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { paths } from "../.generated/api";
import { customFetch } from "@ucdjs-internal/shared";

type ManifestResponse = paths["/api/v1/files/.ucd-store.json"]["get"]["responses"][200]["content"]["application/json"];
type FileResponse = paths["/api/v1/files/{wildcard}"]["get"]["responses"][200]["content"];

export interface FilesResource {
  /**
   * Get a file or directory listing from the Unicode data
   *
   * @param {string} path - The path to the file (e.g., "16.0.0/ucd/UnicodeData.txt")
   * @returns File content as text, JSON, or other format depending on the file type
   */
  get: (path: string) => Promise<SafeFetchResponse<string | FileResponse["application/json"]>>;

  /**
   * Get the UCD manifest file containing metadata about available files
   */
  getManifest: () => Promise<SafeFetchResponse<ManifestResponse>>;
}

export interface CreateFilesResourceOptions {
  baseUrl: string;
  filesPath: string;
  manifestPath: string;
}

export function createFilesResource(options: CreateFilesResourceOptions): FilesResource {
  const { baseUrl, filesPath, manifestPath } = options;

  return {
    async get(path: string) {
      const url = new URL(`${filesPath}/${path}`, baseUrl);

      return customFetch.safe(url.toString());
    },

    async getManifest() {
      const url = new URL(manifestPath, baseUrl);

      return customFetch.safe<ManifestResponse>(url.toString(), {
        parseAs: "json",
      });
    },
  };
}

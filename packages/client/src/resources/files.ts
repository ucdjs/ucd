import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import type { paths } from "../.generated/api";
import { customFetch, tryOr } from "@ucdjs-internal/shared";
import { PathTraversalError, resolveSafePath } from "@ucdjs/path-utils";

type FileResponse = paths["/api/v1/files/{wildcard}"]["get"]["responses"][200]["content"];

export interface FilesResource {
  /**
   * Get a file or directory listing from the Unicode data
   *
   * @param {string} path - The path to the file (e.g., "16.0.0/ucd/UnicodeData.txt")
   * @returns {Promise<SafeFetchResponse<FileResponse[keyof FileResponse]>>} File content as text, JSON, or other format depending on the file type
   */
  get: (path: string) => Promise<SafeFetchResponse<FileResponse[keyof FileResponse]>>;
}

export interface CreateFilesResourceOptions {
  baseUrl: string;
  endpoints: UCDWellKnownConfig["endpoints"];
}

export function createFilesResource(options: CreateFilesResourceOptions): FilesResource {
  const { baseUrl, endpoints } = options;

  return {
    async get(path: string) {
      // Validate that the path doesn't attempt to traverse outside the files endpoint.
      // We use endpoints.files (e.g., "/api/v1/files") as the base path because using "/"
      // as root won't detect traversal - pathe.resolve("/", "../../") returns "/" since
      // you can't go above root on Unix, making isWithinBase("/", "/") return true.
      // By using the endpoint path as base, "../.." would resolve to "/" which IS outside
      // "/api/v1/files", correctly triggering a PathTraversalError.
      const resolvedPathOrError = tryOr({
        try: () => resolveSafePath(endpoints.files, path),
        err: (err) => {
          if (err instanceof PathTraversalError) {
            return {
              data: null,
              error: err,
            };
          }

          throw err;
        },
      });

      if (typeof resolvedPathOrError !== "string") {
        return resolvedPathOrError;
      }

      const url = new URL(resolvedPathOrError, baseUrl);

      return customFetch.safe(url.toString());
    },
  };
}

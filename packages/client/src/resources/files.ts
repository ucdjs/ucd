import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import type { paths } from "../.generated/api";
import { customFetch, tryOr } from "@ucdjs-internal/shared";
import { PathTraversalError, resolveSafePath } from "@ucdjs/path-utils";

type FileResponse = paths["/api/v1/files/{wildcard}"]["get"]["responses"][200]["content"];
type FileGetQueryOptions = paths["/api/v1/files/{wildcard}"]["get"]["parameters"]["query"];
type FileHeadQueryOptions = paths["/api/v1/files/{wildcard}"]["head"]["parameters"]["query"];

// eslint-disable-next-line ts/explicit-function-return-type
function applyFileQuery(url: URL, query: FileGetQueryOptions | FileHeadQueryOptions = {}) {
  if (query.query) {
    url.searchParams.set("query", query.query);
  }

  if (query.pattern) {
    url.searchParams.set("pattern", query.pattern);
  }

  if (query.sort) {
    url.searchParams.set("sort", query.sort);
  }

  if (query.order) {
    url.searchParams.set("order", query.order);
  }

  if (query.type && query.type !== "all") {
    url.searchParams.set("type", query.type);
  }
}

export interface FilesResource {
  /**
   * Get a file or directory listing from the Unicode data
   *
   * @param {string} path - The path to the file (e.g., "16.0.0/ucd/UnicodeData.txt")
   * @returns {Promise<SafeFetchResponse<FileResponse[keyof FileResponse]>>} File content as text, JSON, or other format depending on the file type
   */
  get: (path: string, query?: FileGetQueryOptions) => Promise<SafeFetchResponse<FileResponse[keyof FileResponse]>>;

  /**
   * Get metadata for a file or directory without downloading the response body.
   */
  head: (path: string, query?: FileHeadQueryOptions) => Promise<SafeFetchResponse<null>>;
}

export interface CreateFilesResourceOptions {
  baseUrl: string;
  endpoints: UCDWellKnownConfig["endpoints"];
}

export function createFilesResource(options: CreateFilesResourceOptions): FilesResource {
  const { baseUrl, endpoints } = options;

  // eslint-disable-next-line ts/explicit-function-return-type
  function resolveFilesUrl(path: string) {
    // Validate that the path doesn't attempt to traverse outside the files endpoint.
    // We use endpoints.files (e.g., "/api/v1/files") as the base path because using "/"
    // as root won't detect traversal - pathe.resolve("/", "../../") returns "/" since
    // you can't go above root on Unix, making isWithinBase("/", "/") return true.
    // By using the endpoint path as base, "../.." would resolve to "/" which IS outside
    // "/api/v1/files", correctly triggering a PathTraversalError.
    return tryOr({
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
  }

  return {
    async get(path: string, query: FileGetQueryOptions = {}) {
      const resolvedPathOrError = resolveFilesUrl(path);

      if (typeof resolvedPathOrError !== "string") {
        return resolvedPathOrError;
      }

      const url = new URL(resolvedPathOrError, baseUrl);
      applyFileQuery(url, query);

      return customFetch.safe(url.toString());
    },

    async head(path: string, query: FileHeadQueryOptions = {}) {
      const resolvedPathOrError = resolveFilesUrl(path);

      if (typeof resolvedPathOrError !== "string") {
        return resolvedPathOrError;
      }

      const url = new URL(resolvedPathOrError, baseUrl);
      applyFileQuery(url, query);

      const result = await customFetch.safe(url.toString(), {
        method: "HEAD",
        parseAs: "__internal_head__",
      });

      return {
        ...result,
        data: null,
      };
    },
  };
}

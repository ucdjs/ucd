import type { Entry } from "apache-autoindex-parse";
import type { StatusCode } from "hono/utils/http-status";
import { trimLeadingSlash, trimTrailingSlash } from "@luxass/utils";
import { createGlobMatcher, isValidGlobPattern } from "@ucdjs-internal/shared";
import {
  DEFAULT_USER_AGENT,
  UCD_STAT_CHILDREN_DIRS_HEADER,
  UCD_STAT_CHILDREN_FILES_HEADER,
  UCD_STAT_CHILDREN_HEADER,
  UCD_STAT_SIZE_HEADER,
  UCD_STAT_TYPE_HEADER,
} from "@ucdjs/env";
import { parse } from "apache-autoindex-parse";
import { HTML_EXTENSIONS } from "../constants";
import { determineContentTypeFromExtension, isInvalidPath } from "../routes/v1_files/utils";

/**
 * Parses an HTML directory listing from Unicode.org and extracts file/directory entries.
 *
 * This function takes raw HTML content from a Unicode.org directory listing page
 * and converts it into a structured array of Entry objects containing metadata
 * about each file or subdirectory.
 *
 * @param {string} html - The raw HTML content from a Unicode.org directory listing page
 * @returns {Promise<Entry[]>} A promise that resolves to an array of Entry objects, each containing
 *          type, name, path, and lastModified information for files/directories
 *
 * @example
 * ```typescript
 * const html = await fetch('https://unicode.org/Public?F=2').then(r => r.text());
 * const entries = await parseUnicodeDirectory(html);
 * console.log(entries); // [{ type: 'directory', name: 'UNIDATA', path: '/UNIDATA', ... }]
 * ```
 */
export async function parseUnicodeDirectory(html: string, basePath = ""): Promise<Entry[]> {
  const files = parse(html, {
    format: "F2",
    basePath,
  });

  return files.map((entry) => {
    entry.name = trimLeadingSlash(trimTrailingSlash(entry.name));
    return entry;
  });
}

export interface RawUnicodeAssetResult {
  /**
   * Whether the request was successful (status 200-299)
   */
  ok: boolean;

  /**
   * The HTTP status code returned by the server
   */
  status: StatusCode;

  /**
   * The original Fetch Response object
   */
  response: Response;

  /**
   * The final URL fetched
   */
  url: string;

  /**
   * The normalized path used for the request
   */
  normalizedPath: string;

  /**
   * The file extension (lowercase, no dot)
   */
  extension: string;
}

const PATH_TRIM_RE = /^\/+|\/+$/g;

export async function getRawUnicodeAsset(path: string): Promise<RawUnicodeAssetResult> {
  const normalizedPath = path.trim().replace(PATH_TRIM_RE, "");
  const url = normalizedPath ? `https://unicode.org/Public/${normalizedPath}?F=2` : "https://unicode.org/Public?F=2";

  const response = await fetch(url, {
    method: "GET",
    headers: { "User-Agent": DEFAULT_USER_AGENT },
  });

  const leaf = normalizedPath.split("/").pop() ?? "";
  const extension = leaf.includes(".") ? leaf.split(".").pop()!.toLowerCase() : "";

  return {
    ok: response.ok,
    status: response.status as StatusCode,
    response,
    url,
    normalizedPath,
    extension,
  };
}

function buildStatsHeaders(files: Entry[], base: Record<string, string>): Record<string, string> {
  return {
    ...base,
    "Content-Type": "application/json",
    [UCD_STAT_TYPE_HEADER]: "directory",
    [UCD_STAT_CHILDREN_HEADER]: `${files.length}`,
    [UCD_STAT_CHILDREN_FILES_HEADER]: `${files.filter((f) => f.type === "file").length}`,
    [UCD_STAT_CHILDREN_DIRS_HEADER]: `${files.filter((f) => f.type === "directory").length}`,
  };
}

export interface DirectoryFilterOptions {
  /**
   * Search prefix for file names
   */
  query?: string;

  /**
   * Glob pattern for filtering
   */
  pattern?: string;

  /**
   * Filter by "all" | "files" | "directories"
   */
  type?: string;

  /**
   * Sort field: "name" | "lastModified"
   */
  sort?: string;

  /**
   * Sort direction: "asc" | "desc"
   */
  order?: string;
}

/**
 * Applies filtering and sorting to directory entries based on query parameters.
 *
 * @param {Entry[]} files - Array of directory entries to filter and sort
 * @param {DirectoryFilterOptions} options - Filter and sort options
 * @returns {Entry[]} Filtered and sorted array of entries
 */
export function applyDirectoryFiltersAndSort(
  files: Entry[],
  options: DirectoryFilterOptions,
): Entry[] {
  let filtered = [...files];

  if (options.query) {
    const q = options.query.toLowerCase();
    filtered = filtered.filter((e) => e.name.toLowerCase().startsWith(q));
  }

  if (options.pattern) {
    const matcher = createGlobMatcher(options.pattern);
    filtered = filtered.filter((e) => matcher(e.name));
  }

  if (options.type === "files") {
    filtered = filtered.filter((e) => e.type === "file");
  } else if (options.type === "directories") {
    filtered = filtered.filter((e) => e.type === "directory");
  }

  const isDesc = options.order === "desc";
  return filtered.toSorted((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    const res = options.sort === "lastModified"
      ? (a.lastModified ?? 0) - (b.lastModified ?? 0)
      : a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    return isDesc ? -res : res;
  });
}

export interface UnicodeAssetOptions extends DirectoryFilterOptions {
  /**
   * Whether to strip /ucd/ from paths in the result
   */
  stripUCDPrefix?: boolean;

  /**
   *  Whether the request is a HEAD request (affects whether body is returned)
   */
  isHeadRequest?: boolean;
}

export type UnicodeAssetResult
  = | {
    kind: "error";
    status: number;
    body: string;
    headers: Record<string, string>;
  }
  | {
    kind: "file";
    status: number;
    body: Uint8Array<ArrayBuffer> | ReadableStream | null;
    headers: Record<string, string>;
  }
  | {
    kind: "directory";
    status: number;
    body: string;
    headers: Record<string, string>;
  };

export async function getUnicodeAsset(path: string, options: UnicodeAssetOptions): Promise<UnicodeAssetResult> {
  if (isInvalidPath(path)) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      kind: "error",
      body: JSON.stringify({ status: 400, message: "Invalid path" }),
    };
  }

  try {
    const asset = await getRawUnicodeAsset(path);
    if (!asset.ok) {
      if (asset.status === 404) {
        return {
          status: 404,
          headers: { "Content-Type": "application/json" },
          kind: "error",
          body: JSON.stringify({ status: 404, message: "Resource not found" }),
        };
      }

      return {
        status: 502,
        headers: { "Content-Type": "application/json" },
        kind: "error",
        body: JSON.stringify({ status: 502, message: "Bad Gateway" }),
      };
    }

    const { response, extension, normalizedPath } = asset;
    const contentType = response.headers.get("content-type") || "";
    const lastMod = response.headers.get("Last-Modified");
    const baseHeaders: Record<string, string> = lastMod ? { "Last-Modified": lastMod } : {};

    if (contentType.includes("text/html") && !HTML_EXTENSIONS.includes(`.${extension}`)) {
      let entries = await parseUnicodeDirectory(await response.text(), normalizedPath || "/");

      if (options.stripUCDPrefix) {
        entries = entries.map((e) => ({ ...e, path: e.path.replace(/\/ucd\//g, "/") }));
      }

      if (options.pattern && !isValidGlobPattern(options.pattern, { maxLength: 128, maxSegments: 8 })) {
        return { status: 400, headers: {}, kind: "error", body: "Invalid glob pattern" };
      }

      const filtered = applyDirectoryFiltersAndSort(entries, options);
      return {
        status: 200,
        kind: "directory",
        headers: buildStatsHeaders(filtered, baseHeaders),
        body: JSON.stringify(filtered),
      };
    }

    const size = response.headers.get("content-length");
    const cd = response.headers.get("Content-Disposition");
    const headers: Record<string, string> = {
      ...baseHeaders,
      "Content-Type": contentType || determineContentTypeFromExtension(extension),
      [UCD_STAT_TYPE_HEADER]: "file",
    };

    if (size && options.isHeadRequest) {
      // Only include size headers for HEAD requests, not for streamed GET responses
      headers[UCD_STAT_SIZE_HEADER] = size;
      headers["Content-Length"] = size;
    }
    if (cd) headers["Content-Disposition"] = cd;

    return {
      status: 200,
      headers,
      kind: "file",
      body: options.isHeadRequest ? null : response.body,
    };
  } catch (err) {
    return {
      status: 502,
      headers: { "Content-Type": "application/json" },
      kind: "error",
      body: JSON.stringify({ status: 502, message: err instanceof Error ? err.message : "Fetch error" }),
    };
  }
}

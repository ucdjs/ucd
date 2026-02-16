/* eslint-disable no-console */
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

export interface DirectoryFilterOptions {
  /**
   * A string to filter file/directory names that start with this query (case-insensitive).
   */
  query?: string;

  /**
   * A glob pattern to filter file/directory names.
   */
  pattern?: string;

  /**
   * Type of entries to include: "all" (default), "files", or "directories".
   */
  type?: string;

  /**
   * Field to sort by: "name" (default) or "lastModified".
   */
  sort?: string;

  /**
   * Sort order: "asc" (default) or "desc".
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

  // Apply query filter (prefix search, case-insensitive)
  if (options.query) {
    console.info(`[v1_files]: applying query filter: ${options.query}`);
    const queryLower = options.query.toLowerCase();
    filtered = filtered.filter((entry) => entry.name.toLowerCase().startsWith(queryLower));
  }

  // Apply pattern filter if provided
  if (options.pattern) {
    console.info(`[v1_files]: applying glob pattern filter: ${options.pattern}`);
    const matcher = createGlobMatcher(options.pattern);
    filtered = filtered.filter((entry) => matcher(entry.name));
  }

  // Apply type filter
  const type = options.type || "all";
  if (type === "files") {
    filtered = filtered.filter((entry) => entry.type === "file");
  } else if (type === "directories") {
    filtered = filtered.filter((entry) => entry.type === "directory");
  }

  // Apply sorting (directories always first, like Windows File Explorer)
  const sort = options.sort || "name";
  const order = options.order || "asc";

  filtered = filtered.toSorted((a, b) => {
    // Directories always come first
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }

    // Within same type, apply the requested sort
    let comparison: number;

    if (sort === "lastModified") {
      // lastModified is always available from parseUnicodeDirectory
      comparison = (a.lastModified ?? 0) - (b.lastModified ?? 0);
    } else {
      // Natural name sorting (numeric aware) so 2.0.0 < 10.0.0
      comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    }

    return order === "desc" ? -comparison : comparison;
  });

  return filtered;
}

export function buildDirectoryHeaders(
  files: Entry[],
  baseHeaders: Record<string, string>,
): Record<string, string> {
  return {
    ...baseHeaders,
    [UCD_STAT_TYPE_HEADER]: "directory",
    [UCD_STAT_CHILDREN_HEADER]: `${files.length}`,
    [UCD_STAT_CHILDREN_FILES_HEADER]: `${files.filter((f) => f.type === "file").length}`,
    [UCD_STAT_CHILDREN_DIRS_HEADER]: `${files.filter((f) => f.type === "directory").length}`,
  };
}

export function buildFileHeaders(
  contentType: string,
  baseHeaders: Record<string, string>,
  response: Response,
  actualContentLength: number,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    ...baseHeaders,
    [UCD_STAT_TYPE_HEADER]: "file",
    [UCD_STAT_SIZE_HEADER]: `${actualContentLength}`,
    "Content-Length": `${actualContentLength}`,
  };

  const cd = response.headers.get("Content-Disposition");
  if (cd) headers["Content-Disposition"] = cd;

  return headers;
}

export interface FileResponseOptions {
  contentType: string;
  baseHeaders: Record<string, string>;
  response: Response;
  isHeadRequest: boolean;
}

export async function handleFileResponse(
  c: any,
  options: FileResponseOptions,
): Promise<Response> {
  const { contentType, baseHeaders, response, isHeadRequest } = options;

  if (isHeadRequest) {
    const blob = await response.blob();
    const actualSize = blob.size;
    const headers = buildFileHeaders(contentType, baseHeaders, response, actualSize);
    console.log(`[file-handler]: HEAD request, calculated size: ${actualSize}`);
    return c.newResponse(null, 200, headers);
  }

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    ...baseHeaders,
    [UCD_STAT_TYPE_HEADER]: "file",
  };

  const cd = response.headers.get("Content-Disposition");
  if (cd) headers["Content-Disposition"] = cd;

  console.log(`[file-handler]: binary file, streaming without buffering`);

  return c.newResponse(response.body, 200, headers);
}

export interface DirectoryResponseOptions {
  files: Entry[];
  baseHeaders: Record<string, string>;
}

export function handleDirectoryResponse(
  c: any,
  options: DirectoryResponseOptions,
): Response {
  const { files, baseHeaders } = options;
  const headers = buildDirectoryHeaders(files, baseHeaders);
  return c.json(files, 200, headers);
}

export function determineFileExtension(leaf: string): string {
  return leaf.includes(".") ? leaf.split(".").pop()!.toLowerCase() : "";
}

export function isHtmlFile(extName: string): boolean {
  return HTML_EXTENSIONS.includes(`.${extName}`);
}

export function isDirectoryListing(contentType: string, extName: string): boolean {
  return contentType.includes("text/html") && !isHtmlFile(extName);
}

export interface WildcardHandlerOptions {
  query?: string;
  pattern?: string;
  type?: string;
  sort?: string;
  order?: string;
  stripUCDPrefix?: boolean;
  isHeadRequest?: boolean;
}

export interface WildcardHandlerResult {
  status: StatusCode;
  headers: Record<string, string>;
  kind: "file" | "directory" | "error";
  body: string | ArrayBuffer | ReadableStream<Uint8Array> | null;
}

function errorResult(status: StatusCode, message: string): WildcardHandlerResult {
  return {
    status,
    headers: {
      "Content-Type": "application/json",
    },
    kind: "error",
    body: JSON.stringify({
      status,
      message,
      timestamp: new Date().toISOString(),
    }),
  };
}

export async function fetchUnicodeFile(path: string, options: WildcardHandlerOptions): Promise<WildcardHandlerResult> {
  const rawPath = path.trim();

  if (isInvalidPath(rawPath)) {
    return errorResult(400, "Invalid path");
  }

  const normalizedPath = rawPath.replace(/^\/+|\/+$/g, "");
  const url = normalizedPath
    ? `https://unicode.org/Public/${normalizedPath}?F=2`
    : "https://unicode.org/Public?F=2";

  console.info(`[v1_files]: fetching file at ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return errorResult(404, "Resource not found");
    }

    return errorResult(502, "Bad Gateway");
  }

  let contentType = response.headers.get("content-type") || "";
  const lastModified = response.headers.get("Last-Modified") || undefined;
  const baseHeaders: Record<string, string> = {};
  if (lastModified) {
    baseHeaders["Last-Modified"] = lastModified;
  }

  const leaf = normalizedPath.split("/").pop() ?? "";
  const extName = determineFileExtension(leaf);
  const isDir = isDirectoryListing(contentType, extName);

  console.info(`[v1_files]: fetched content type: ${contentType} for .${extName} file`);

  if (isDir) {
    const html = await response.text();
    let parsedFiles = await parseUnicodeDirectory(html, normalizedPath || "/");

    if (options.stripUCDPrefix) {
      parsedFiles = parsedFiles.map((file) => ({
        ...file,
        path: file.path.replace(/\/ucd\//g, "/"),
      }));
    }

    const pattern = options.pattern;
    if (pattern && !isValidGlobPattern(pattern, {
      maxLength: 128,
      maxSegments: 8,
      maxBraceExpansions: 8,
      maxStars: 16,
      maxQuestions: 16,
    })) {
      return errorResult(400, "Invalid glob pattern");
    }

    const files = applyDirectoryFiltersAndSort(parsedFiles, {
      query: options.query,
      pattern,
      type: options.type,
      sort: options.sort,
      order: options.order,
    });

    const headers = buildDirectoryHeaders(files, baseHeaders);

    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      kind: "directory",
      body: JSON.stringify(files),
    };
  }

  contentType ||= determineContentTypeFromExtension(extName);

  if (options.isHeadRequest) {
    const blob = await response.blob();
    const actualSize = blob.size;
    const headers = buildFileHeaders(contentType, baseHeaders, response, actualSize);

    return {
      status: 200,
      headers,
      kind: "file",
      body: null,
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    ...baseHeaders,
    [UCD_STAT_TYPE_HEADER]: "file",
  };

  const cd = response.headers.get("Content-Disposition");
  if (cd) {
    headers["Content-Disposition"] = cd;
  }

  return {
    status: 200,
    headers,
    kind: "file",
    body: response.body,
  };
}

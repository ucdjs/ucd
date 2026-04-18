import type { FileEntry } from "@ucdjs/schemas";
import type { SearchQueryParams } from "../lib/file-explorer";
import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  UCD_STAT_SIZE_HEADER,
  UCD_STAT_TYPE_HEADER,
} from "@ucdjs/env";
import { MAX_INLINE_FILE_SIZE } from "../lib/file-explorer";
import { getShikiLanguage, highlight } from "../lib/highlight";

/**
 * Response type for file operations
 * - `directory`: Returns a list of files/folders in the directory
 * - `file`: Returns the file content as text with its content type
 * - `file-too-large`: Returns metadata for files exceeding MAX_INLINE_FILE_SIZE
 */
export type FilesResponse
  = | { type: "directory"; files: FileEntry[] }
    | { type: "file"; html: string; contentType: string; size: number }
    | { type: "file-too-large"; size: number; contentType: string; downloadUrl: string };

type FileQueryParams = {
  path: string;
  statType?: string | null;
  size?: number | null;
} & SearchQueryParams;

interface NormalizedFilesQueryOptions {
  path: string;
  pattern: string;
  sort: "name" | "lastModified";
  order: "asc" | "desc";
  query: string;
  type: "all" | "files" | "directories";
  statType?: string | null;
  size?: number | null;
}

function parseSizeHeader(sizeHeader: string | null) {
  if (!sizeHeader) return null;

  const size = Number.parseInt(sizeHeader, 10);

  return Number.isFinite(size) ? size : null;
}

function normalizeFilesQueryOptions(options: FilesQueryOptions = {}): NormalizedFilesQueryOptions {
  return {
    path: options.path || "",
    pattern: options.pattern || "",
    sort: options.sort || "name",
    order: options.order || "asc",
    query: options.query || "",
    type: options.type || "all",
    statType: options.statType,
    size: typeof options.size === "number" ? options.size : null,
  };
}

/**
 * Server function to fetch files from the UCD API
 *
 * Performance optimizations:
 * 1. Uses HEAD request first to check entry type and size
 * 2. For large files (> 1MB), returns metadata only - no content fetch
 * 3. For directories and small files, fetches full content with GET
 *
 * This prevents loading massive files into memory and keeps routing fast.
 */
export const fetchFiles = createServerFn({ method: "GET" })
  .inputValidator((data: FileQueryParams) => data)
  .handler(async ({ data, context }) => {
    const normalized = normalizeFilesQueryOptions(data);
    const fileQuery = {
      query: normalized.query || undefined,
      pattern: normalized.pattern,
      sort: normalized.sort,
      order: normalized.order,
      type: normalized.type,
    } as const;

    let statType = normalized.statType ?? null;
    let contentType = "text/plain";
    let size = normalized.size;
    let downloadUrl: string | null = null;

    const shouldFetchHead = !statType || (statType === "file" && size === null);

    if (shouldFetchHead) {
      const { error, response: headRes } = await context.client.files.head(normalized.path, fileQuery);

      if (error || !headRes?.ok) {
        throw new Error(`Failed to fetch: ${error?.statusText || headRes?.statusText || "Unknown error"}`);
      }

      downloadUrl = headRes.url;
      statType = headRes.headers.get(UCD_STAT_TYPE_HEADER);
      contentType = headRes.headers.get("Content-Type") || "text/plain";
      const sizeHeader = headRes.headers.get(UCD_STAT_SIZE_HEADER) || headRes.headers.get("Content-Length");
      size = parseSizeHeader(sizeHeader);
    }

    // Step 2: For large files, return metadata only (no GET request needed)
    const knownSize = typeof size === "number" ? size : null;

    if (statType === "file" && knownSize !== null && knownSize > MAX_INLINE_FILE_SIZE) {
      return {
        type: "file-too-large",
        size: knownSize,
        contentType,
        downloadUrl: downloadUrl || normalized.path,
      };
    }

    const { data: responseData, error, response: res } = await context.client.files.get(normalized.path, fileQuery);

    if (error || !res?.ok) {
      throw new Error(`Failed to fetch: ${error?.statusText || res?.statusText || "Unknown error"}`);
    }

    downloadUrl = res.url;
    const responseStatType = res.headers.get(UCD_STAT_TYPE_HEADER) ?? statType;
    const responseContentType = res.headers.get("Content-Type") || contentType;
    const responseSizeHeader = res.headers.get(UCD_STAT_SIZE_HEADER) || res.headers.get("Content-Length");
    const responseSize = parseSizeHeader(responseSizeHeader);
    const isJson = responseContentType.includes("application/json");
    const isText = responseContentType.startsWith("text/") || isJson;

    if (!isText) {
      throw new Error(`Unexpected Content-Type: ${responseContentType}`);
    }

    const resolvedStatType = responseStatType
      ?? (isJson ? "directory" : "file");

    if (resolvedStatType === "file" && responseSize !== null && responseSize > MAX_INLINE_FILE_SIZE) {
      return {
        type: "file-too-large",
        size: responseSize,
        contentType: responseContentType,
        downloadUrl: downloadUrl || normalized.path,
      };
    }

    if (resolvedStatType === "file") {
      if (typeof responseData !== "string") {
        throw new TypeError(`Unexpected file response type: ${typeof responseData}`);
      }

      const content = responseData;
      const contentSize = new TextEncoder().encode(content).byteLength;

      if (contentSize > MAX_INLINE_FILE_SIZE) {
        return {
          type: "file-too-large",
          size: contentSize,
          contentType: responseContentType,
          downloadUrl: downloadUrl || normalized.path,
        };
      }

      const fileName = normalized.path.split("/").filter(Boolean).pop() || "file";
      const html = await highlight(content, getShikiLanguage(fileName));
      return {
        type: "file",
        html,
        contentType: responseContentType,
        size: size ?? responseSize ?? contentSize,
      };
    }

    // Directory listing (JSON)
    if (isJson) {
      const files = responseData as FileEntry[];
      return { type: "directory", files };
    }

    if (typeof responseData !== "string") {
      throw new TypeError(`Unexpected text response type: ${typeof responseData}`);
    }

    const content = responseData;
    const contentSize = new TextEncoder().encode(content).byteLength;
    const fileName = normalized.path.split("/").filter(Boolean).pop() || "file";
    const html = await highlight(content, getShikiLanguage(fileName));
    return {
      type: "file",
      html,
      contentType: responseContentType,
      size: size ?? responseSize ?? contentSize,
    };
  });

interface FilesQueryOptions extends Omit<SearchQueryParams, "viewMode"> {
  path?: string;
  statType?: string | null;
  size?: number | null;
}

export function filesQueryOptions(options: FilesQueryOptions = {}) {
  const normalized = normalizeFilesQueryOptions(options);

  return queryOptions({
    queryKey: [
      "files",
      normalized.path,
      normalized.pattern,
      normalized.sort,
      normalized.order,
      normalized.query,
      normalized.type,
      normalized.statType,
      normalized.size,
      MAX_INLINE_FILE_SIZE,
    ],
    queryFn: ({ signal }) => fetchFiles({
      data: {
        path: normalized.path,
        pattern: normalized.pattern,
        sort: normalized.sort,
        order: normalized.order,
        query: normalized.query,
        type: normalized.type,
        statType: normalized.statType,
        size: normalized.size,
      },
      signal,
    }),
    gcTime: 1000 * 60 * 60,
    structuralSharing: false,
  });
}

type DirectoryListingQueryOptions = Omit<FilesQueryOptions, "size" | "statType">;

export function directoryListingQueryOptions(options: DirectoryListingQueryOptions = {}) {
  return filesQueryOptions({
    ...options,
    statType: "directory",
  });
}

export const getFileHeadInfo = createServerFn({ method: "GET" })
  .inputValidator((data: { path: string }) => data)
  .handler(async ({ data, context }) => {
    const { error, response: headRes } = await context.client.files.head(data.path);

    if (error?.status === 404 || headRes?.status === 404) {
      throw notFound();
    }

    if (error || !headRes?.ok) {
      throw new Error(`Failed to fetch: ${error?.statusText || headRes?.statusText || "Unknown error"}`);
    }

    const statType = headRes.headers.get(UCD_STAT_TYPE_HEADER);
    const contentType = headRes.headers.get("Content-Type") || "text/plain";
    const sizeHeader = headRes.headers.get(UCD_STAT_SIZE_HEADER) || headRes.headers.get("Content-Length");
    const size = parseSizeHeader(sizeHeader);
    return {
      statType,
      contentType,
      size,
    };
  });

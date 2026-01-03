import type { FileEntry } from "@ucdjs/schemas";
import type z from "zod";
import type { SearchQueryParams, searchSchema } from "@/routes/file-explorer/$";
import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  UCD_STAT_CHILDREN_DIRS_HEADER,
  UCD_STAT_CHILDREN_FILES_HEADER,
  UCD_STAT_CHILDREN_HEADER,
  UCD_STAT_SIZE_HEADER,
  UCD_STAT_TYPE_HEADER,
} from "@ucdjs/env";

/**
 * Maximum file size to load completely (1MB)
 * Files larger than this will return metadata only
 */
const MAX_INLINE_FILE_SIZE = 1024 * 1024;

/**
 * Response type for file operations
 * - `directory`: Returns a list of files/folders in the directory
 * - `file`: Returns the file content as text with its content type
 * - `file-too-large`: Returns metadata for files exceeding MAX_INLINE_FILE_SIZE
 */
export type FilesResponse
  = | { type: "directory"; files: FileEntry[] }
    | { type: "file"; content: string; contentType: string; size: number }
    | { type: "file-too-large"; size: number; contentType: string; downloadUrl: string };

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
  .inputValidator((data: { path: string } & z.output<typeof searchSchema>) => data)
  .handler(async ({ data, context }) => {
    const baseFilesUrl = `${context.apiBaseUrl}/api/v1/files`;
    const url = new URL(data.path, `${baseFilesUrl}/`);

    if (data.query) {
      url.searchParams.set("query", data.query);
    }

    url.searchParams.set("pattern", data.pattern || "");
    url.searchParams.set("sort", data.sort || "name");
    url.searchParams.set("order", data.order || "asc");

    if (data.type && data.type !== "all") {
      url.searchParams.set("type", data.type);
    }

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.statusText}`);
    }

    const statType = res.headers.get(UCD_STAT_TYPE_HEADER);
    const contentType = res.headers.get("Content-Type") || "text/plain";
    const sizeHeader = res.headers.get(UCD_STAT_SIZE_HEADER) || res.headers.get("Content-Length");
    const size = sizeHeader ? Number.parseInt(sizeHeader, 10) : 0;

    // Step 2: For large files, return metadata only (no GET request needed)
    if (statType === "file" && size > MAX_INLINE_FILE_SIZE) {
      return {
        type: "file-too-large",
        size,
        contentType,
        downloadUrl: url.toString(),
      };
    }

    if (statType === "file") {
      const content = await res.text();
      return {
        type: "file",
        content,
        contentType,
        size: size || content.length,
      };
    }

    // Directory listing (JSON)
    const files = (await res.json()) as FileEntry[];
    return { type: "directory", files };
  });

interface FilesQueryOptions extends Omit<SearchQueryParams, "viewMode"> {
  path?: string;
}

export function filesQueryOptions(options: FilesQueryOptions = {}) {
  return queryOptions({
    queryKey: [
      "files",
      options.path,
      options.pattern,
      options.sort,
      options.order,
      options.query,
      options.type,
    ],
    queryFn: () => fetchFiles({ data: {
      path: options.path || "",
      pattern: options.pattern,
      sort: options.sort,
      order: options.order,
      query: options.query,
      type: options.type,
    } }),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export const getFileHeadInfo = createServerFn({ method: "GET" })
  .inputValidator((data: {
    path: string;
  } & Omit<SearchQueryParams, "viewMode">) => data)
  .handler(async ({ data, context }) => {
    const baseFilesUrl = `${context.apiBaseUrl}/api/v1/files`;
    const url = new URL(data.path, `${baseFilesUrl}/`);

    if (data.query) {
      url.searchParams.set("query", data.query);
    }

    url.searchParams.set("pattern", data.pattern || "");
    url.searchParams.set("sort", data.sort || "name");
    url.searchParams.set("order", data.order || "asc");

    if (data.type && data.type !== "all") {
      url.searchParams.set("type", data.type);
    }

    const headRes = await fetch(url, { method: "HEAD" });

    if (headRes.status === 404) {
      throw notFound();
    }

    if (!headRes.ok) {
      throw new Error(`Failed to fetch: ${headRes.statusText}`);
    }

    const statType = headRes.headers.get(UCD_STAT_TYPE_HEADER);
    const sizeHeader = headRes.headers.get(UCD_STAT_SIZE_HEADER) || headRes.headers.get("Content-Length");
    const size = sizeHeader ? Number.parseInt(sizeHeader, 10) : 0;
    const amountChildrenHeader = headRes.headers.get(UCD_STAT_CHILDREN_HEADER);
    const amountChildrenFilesHeader = headRes.headers.get(UCD_STAT_CHILDREN_FILES_HEADER);
    const amountChildrenDirsHeader = headRes.headers.get(UCD_STAT_CHILDREN_DIRS_HEADER);

    return {
      statType,
      size,
      amount: {
        total: amountChildrenHeader ? Number.parseInt(amountChildrenHeader, 10) : 0,
        files: amountChildrenFilesHeader ? Number.parseInt(amountChildrenFilesHeader, 10) : 0,
        directories: amountChildrenDirsHeader ? Number.parseInt(amountChildrenDirsHeader, 10) : 0,
      },
    };
  });

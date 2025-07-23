import type { Entry } from "apache-autoindex-parse";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { DEFAULT_USER_AGENT } from "@ucdjs/env";
import { parse } from "apache-autoindex-parse";

function trimTrailingSlash(path: string) {
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

export class ProxyFetchError extends Error {
  public details: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ProxyFetchError";
    this.details = details || {};
  }

  get status(): ContentfulStatusCode {
    if (!("status" in this.details)) {
      throw new Error("ProxyFetchError does not have a status property");
    }

    return this.details?.status as ContentfulStatusCode;
  }
}

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
 * @throws {ProxyFetchError} When the HTML cannot be parsed as a directory listing
 *
 * @example
 * ```typescript
 * const html = await fetch('https://unicode.org/Public?F=2').then(r => r.text());
 * const entries = await parseUnicodeDirectory(html);
 * console.log(entries); // [{ type: 'directory', name: 'UNIDATA', path: '/UNIDATA', ... }]
 * ```
 */
export async function parseUnicodeDirectory(html: string): Promise<Entry[]> {
  const files = parse(html, "F2");

  return files.map(({ type, name, path, lastModified }) => ({
    type,
    name: trimTrailingSlash(name),
    path: trimTrailingSlash(path),
    lastModified,
  }));
}

interface UnicodeDirectoryResult {
  type: "directory";
  files: Entry[];
  headers: Headers;
}

interface UnicodeFileResult {
  type: "file";
  content: ArrayBuffer;
  headers: Headers;
}

export type GetEntryByPathResult = UnicodeDirectoryResult | UnicodeFileResult;

/**
 * Gets an entry from Unicode.org's Public directory by path.
 *
 * @param {string} path - The path relative to https://unicode.org/Public/
 * @returns {Promise<GetEntryByPathResult>} Either a directory listing with files or file content with headers
 * @throws {ProxyFetchError} When the request fails or returns an error status
 */
export async function getEntryByPath(path: string = ""): Promise<GetEntryByPathResult> {
  // normalize path: remove leading/trailing slashes
  const normalizedPath = path.replace(/^\/+|\/+$/g, "");
  const url = normalizedPath
    ? `https://unicode.org/Public/${normalizedPath}?F=2`
    : "https://unicode.org/Public?F=2";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new ProxyFetchError(`Failed to fetch Unicode entry at path: ${normalizedPath || "/"}`, {
      status: response.status as ContentfulStatusCode,
    });
  }

  const contentType = response.headers.get("content-type") || "";

  const htmlExtensions = [".html", ".htm", ".xhtml"];
  const isHtmlFile = htmlExtensions.some((ext) =>
    normalizedPath.toLowerCase().endsWith(ext),
  );

  // check if this is a directory listing (HTML response for non-HTML files)
  const isDirectoryListing = contentType.includes("text/html") && !isHtmlFile;

  if (isDirectoryListing) {
    const html = await response.text();
    const files = await parseUnicodeDirectory(html);

    return {
      type: "directory",
      files,
      headers: response.headers,
    };
  }

  return {
    type: "file",
    content: await response.arrayBuffer(),
    headers: response.headers,
  };
}

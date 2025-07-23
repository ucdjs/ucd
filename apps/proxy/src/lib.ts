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

export type GetEntryByPathResult = {
  type: "directory";
  files: Entry[];
  headers: Headers;
} | {
  type: "file";
  content: ArrayBuffer;
  headers: Headers;
};

export async function getEntryByPath(path: string = ""): Promise<GetEntryByPathResult> {
  const url = path ? `https://unicode.org/Public/${path}?F=2` : "https://unicode.org/Public?F=2";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new ProxyFetchError(`failed to fetch entry`, {
      status: response.status as ContentfulStatusCode,
    });
  }

  const contentType = response.headers.get("content-type");

  // if it returns HTML, but the path does not end with "html",
  // it means we are dealing with a directory listing
  // so we parse the HTML and return the directory structure
  if (contentType?.includes("text/html") && !path.endsWith("html")) {
    const text = await response.text();
    return {
      type: "directory",
      files: (await parseUnicodeDirectory(text)).map((file) => ({
        ...file,
        path: path ? `/${path}/${file.name}` : file.name,
      })),
      headers: response.headers,
    };
  }

  return {
    type: "file",
    content: await response.arrayBuffer(),
    headers: response.headers,
  };
}

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

export async function parseUnicodeDirectory(html: string): Promise<Entry[]> {
  const files = parse(html, "F2");
  if (!files) {
    throw new ProxyFetchError("Failed to parse the directory listing", {
      status: 500,
    });
  }

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

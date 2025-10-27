import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { trimTrailingSlash } from "@luxass/utils";
import { DEFAULT_USER_AGENT, UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { decodePathSafely } from "@ucdjs/path-utils";
import { cache } from "hono/cache";
import { HTML_EXTENSIONS, MAX_AGE_ONE_WEEK_SECONDS, V1_FILES_ROUTER_BASE_PATH } from "../../constants";
import { badGateway, badRequest, notFound } from "../../lib/errors";
import { parseUnicodeDirectory } from "../../lib/files";
import { GET_UCD_STORE, METADATA_WILDCARD_ROUTE, WILDCARD_ROUTE } from "./openapi";

export const V1_FILES_ROUTER = new OpenAPIHono<HonoEnv>().basePath(V1_FILES_ROUTER_BASE_PATH);

V1_FILES_ROUTER.openapi(GET_UCD_STORE, async (c) => {
  const response = await fetch("https://unicode.org/Public?F=2", {
    method: "GET",
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
    },
  });

  if (!response.ok) {
    return badGateway(c);
  }

  const html = await response.text();

  const files = await parseUnicodeDirectory(html);

  const store: UCDStoreManifest = {};

  for (const file of files.filter((file) => {
    const match = file.name.match(/^(\d+)\.(\d+)\.(\d+)$/);
    return match && match.length === 4;
  })) {
    store[file.name] = trimTrailingSlash(file.path);
  }

  return c.json(store, 200);
});

V1_FILES_ROUTER.openAPIRegistry.registerPath(WILDCARD_ROUTE);
V1_FILES_ROUTER.openAPIRegistry.registerPath(METADATA_WILDCARD_ROUTE);

V1_FILES_ROUTER.get("/:wildcard{.*}?", cache({
  cacheName: "ucdjs:v1_files:files",
  cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
}), async (c) => {
  const path = c.req.param("wildcard")?.trim() || "";

  const raw = path;
  const lower = raw.toLowerCase();
  // reject encoded double slashes and dot-dot in any position (encoded or plain)
  if (
    raw.startsWith("..")
    || raw.includes("//")
    || lower.startsWith("%2e%2e")
    || lower.includes("%2f%2f")
  ) {
    return badRequest({
      message: "Invalid path",
    });
  }

  const decoded = decodePathSafely(raw);

  if (decoded.split("/").includes("..")) {
    return badRequest({ message: "Invalid path" });
  }

  const normalizedPath = path.replace(/^\/+|\/+$/g, "");
  const url = normalizedPath
    ? `https://unicode.org/Public/${normalizedPath}?F=2`
    : "https://unicode.org/Public?F=2";

  // eslint-disable-next-line no-console
  console.info(`[v1_files]: fetching file at ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return notFound(c, {
        message: "Resource not found",
      });
    }

    return badGateway(c);
  }

  let contentType = response.headers.get("content-type") || "";
  const lastModified = response.headers.get("Last-Modified") || undefined;
  const upstreamContentLength = response.headers.get("Content-Length") || undefined;
  const baseHeaders: Record<string, string> = {};
  if (lastModified) baseHeaders["Last-Modified"] = lastModified;

  const extName = normalizedPath.split(".").pop()?.toLowerCase() || "";

  const isHtmlFile = HTML_EXTENSIONS.includes(`.${extName}`);

  // check if this is a directory listing (HTML response for non-HTML files)
  const isDirectoryListing = contentType.includes("text/html") && !isHtmlFile;

  if (isDirectoryListing) {
    const html = await response.text();
    const files = await parseUnicodeDirectory(html);

    return c.json(files, 200, {
      ...baseHeaders,

      // Custom STAT Headers
      [UCD_FILE_STAT_TYPE_HEADER]: "directory",
    });
  }

  contentType ||= determineContentTypeFromExtension(extName);

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    ...baseHeaders,

    // Custom STAT Headers
    [UCD_FILE_STAT_TYPE_HEADER]: "file",
  };

  const cd = response.headers.get("Content-Disposition");
  if (cd) headers["Content-Disposition"] = cd;
  if (upstreamContentLength) headers["Content-Length"] = upstreamContentLength;
  return c.newResponse(response.body!, 200, headers);
});

function determineContentTypeFromExtension(extName: string) {
  if (HTML_EXTENSIONS.includes(`.${extName}`)) {
    return "text/html";
  }

  if (extName === "csv") {
    return "text/csv";
  }

  if (extName === "xml") {
    return "application/xml";
  }

  if (extName === "txt") {
    return "text/plain";
  }

  if (extName === "pdf") {
    return "application/pdf";
  }

  if (extName === "json") {
    return "application/json";
  }

  return "application/octet-stream"; // Default for binary files
}

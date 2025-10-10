import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { trimTrailingSlash } from "@luxass/utils";
import { DEFAULT_USER_AGENT, UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { cache } from "hono/cache";
import { V1_FILES_ROUTER_BASE_PATH } from "../../constants";
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
  cacheControl: "max-age=3600", // 1 hour
}), async (c) => {
  const path = c.req.param("wildcard")?.trim() || "";

  if (path.startsWith("..") || path.includes("//")
    || path.startsWith("%2E%2E") || path.includes("%2F%2F")) {
    return badRequest({
      message: "Invalid path",
    });
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
  const sharedHeaders = {
    "Last-Modified": response.headers.get("Last-Modified") || "",
    "Content-Length": response.headers.get("Content-Length") || "",
  };

  const htmlExtensions = [".html", ".htm", ".xhtml"];
  const isHtmlFile = htmlExtensions.some((ext) =>
    normalizedPath.toLowerCase().endsWith(ext),
  );

  // check if this is a directory listing (HTML response for non-HTML files)
  const isDirectoryListing = contentType.includes("text/html") && !isHtmlFile;

  if (isDirectoryListing) {
    const html = await response.text();
    const files = await parseUnicodeDirectory(html);

    return c.json(files, 200, {
      ...sharedHeaders,

      // Custom STAT Headers
      [UCD_FILE_STAT_TYPE_HEADER]: "directory",
    });
  }

  const extName = normalizedPath.split(".").pop()?.toLowerCase() || "";
  if (extName === "json") {
    contentType ||= "application/json";
  } else if (extName === "xml") {
    contentType ||= "application/xml";
  } else if (extName === "txt") {
    contentType ||= "text/plain";
  } else if (extName === "html" || extName === "htm" || extName === "xhtml") {
    contentType ||= "text/html";
  } else if (extName === "pdf") {
    contentType ||= "application/pdf";
  } else {
    contentType ||= "application/octet-stream"; // Default for binary files
  }

  return c.newResponse(response.body!, 200, {
    "Content-Type": contentType,
    "Content-Disposition": response.headers.get("Content-Disposition") ?? "",
    ...sharedHeaders,

    // Custom STAT Headers
    [UCD_FILE_STAT_TYPE_HEADER]: "file",
  });
});

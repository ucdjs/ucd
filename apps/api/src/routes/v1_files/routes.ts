import type { HonoEnv } from "../../types";
import type { UCDStore } from "./schemas";
import { OpenAPIHono } from "@hono/zod-openapi";
import { trimTrailingSlash } from "@luxass/utils";
import { DEFAULT_USER_AGENT } from "@ucdjs/env";
import { badGateway, badRequest } from "@ucdjs/worker-shared";
import { cache } from "hono/cache";
import { parseUnicodeDirectory } from "../../lib/files";
import { GET_UCD_STORE, WILDCARD_ROUTE } from "./openapi";

export const V1_FILES_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/files");

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

  const store: UCDStore = {};

  for (const file of files.filter((file) => {
    const match = file.name.match(/^(\d+)\.(\d+)\.(\d+)$/);
    return match && match.length === 4;
  })) {
    store[file.name] = trimTrailingSlash(file.path);
  }

  return c.json(store, 200);
});

V1_FILES_ROUTER.openAPIRegistry.registerPath(WILDCARD_ROUTE);
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

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
    },
  });

  const contentType = response.headers.get("content-type") || "";
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
      "UCD-Stat-Type": "directory",
    });
  }

  return c.newResponse(await response.arrayBuffer(), 200, {
    "Content-Type": response.headers.get("Content-Type") ?? "",
    "Content-Disposition": response.headers.get("Content-Disposition") ?? "",
    ...sharedHeaders,

    // Custom STAT Headers
    "UCD-Stat-Type": "file",
  });
});

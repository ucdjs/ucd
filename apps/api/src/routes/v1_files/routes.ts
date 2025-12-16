import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createGlobMatcher, isValidGlobPattern } from "@ucdjs-internal/shared";
import { DEFAULT_USER_AGENT, UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { decodePathSafely } from "@ucdjs/path-utils";
import { cache } from "hono/cache";
import { HTML_EXTENSIONS, MAX_AGE_ONE_WEEK_SECONDS, V1_FILES_ROUTER_BASE_PATH } from "../../constants";
import { badGateway, badRequest, notFound } from "../../lib/errors";
import { parseUnicodeDirectory } from "../../lib/files";
import { GET_UCD_STORE, METADATA_WILDCARD_ROUTE, SEARCH_ROUTE, WILDCARD_ROUTE } from "./openapi";

export const V1_FILES_ROUTER = new OpenAPIHono<HonoEnv>().basePath(V1_FILES_ROUTER_BASE_PATH);

const STORE_MANIFEST_PREFIX = "manifest/";

function isInvalidPath(raw: string): boolean {
  const lower = raw.toLowerCase();
  // Reject encoded double slashes and dot-dot in any position (encoded or plain)
  if (
    raw.startsWith("..")
    || raw.includes("//")
    || lower.startsWith("%2e%2e")
    || lower.includes("%2f%2f")
  ) {
    return true;
  }

  const decoded = decodePathSafely(raw);
  if (decoded.split("/").includes("..")) {
    return true;
  }

  return false;
}

V1_FILES_ROUTER.openapi(GET_UCD_STORE, async (c) => {
  const bucket = c.env.UCD_BUCKET;
  if (!bucket) {
    console.error("[v1_files]: UCD_BUCKET binding not configured");
    return badGateway(c);
  }

  // List all version directories under the manifest prefix
  const listResult = await bucket.list({ prefix: STORE_MANIFEST_PREFIX });

  if (!listResult.objects.length) {
    console.error("[v1_files]: no manifest versions found in bucket");
    return c.json({} satisfies UCDStoreManifest, 200);
  }

  // Extract unique version directories from the object keys
  // Keys look like: manifest/17.0.0/manifest.json
  const versions = new Set<string>();
  for (const obj of listResult.objects) {
    const relativePath = obj.key.slice(STORE_MANIFEST_PREFIX.length);
    const version = relativePath.split("/")[0];
    if (version) {
      versions.add(version);
    }
  }

  // Fetch manifest.json for each version
  const manifest: UCDStoreManifest = {};
  let latestUploaded: Date | undefined;

  await Promise.all(
    Array.from(versions).map(async (version) => {
      const key = `${STORE_MANIFEST_PREFIX}${version}/manifest.json`;
      const object = await bucket.get(key);

      if (!object) {
        return;
      }

      try {
        const data = await object.json<UCDStoreManifest[typeof version]>();
        manifest[version] = data;

        // Track the latest upload time for Last-Modified header
        if (!latestUploaded || object.uploaded > latestUploaded) {
          latestUploaded = object.uploaded;
        }
      } catch (error) {
        console.error(`[v1_files]: failed to parse manifest for version ${version}:`, error);
      }
    }),
  );

  const headers: Record<string, string> = {
    "Cache-Control": "public, max-age=3600", // 1 hour cache
  };

  if (latestUploaded) {
    headers["Last-Modified"] = latestUploaded.toUTCString();
  }

  return c.json(manifest, 200, headers);
});

// Search endpoint - must be registered BEFORE the wildcard route
V1_FILES_ROUTER.openapi(SEARCH_ROUTE, async (c) => {
  const query = c.req.query("q");
  const basePath = c.req.query("path") || "";

  if (!query) {
    return badRequest({
      message: "Missing required query parameter: q",
    });
  }

  // Validate basePath for path traversal attacks
  if (isInvalidPath(basePath)) {
    return badRequest({
      message: "Invalid path",
    });
  }

  const normalizedPath = basePath.replace(/^\/+|\/+$/g, "");
  const url = normalizedPath
    ? `https://unicode.org/Public/${normalizedPath}?F=2`
    : "https://unicode.org/Public?F=2";

  // eslint-disable-next-line no-console
  console.info(`[v1_files:search]: fetching directory at ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      // Return empty array if the base path doesn't exist
      return c.json([], 200);
    }
    return badGateway(c);
  }

  const contentType = response.headers.get("content-type") || "";

  // If not a directory listing, return empty results
  if (!contentType.includes("text/html")) {
    return c.json([], 200);
  }

  const html = await response.text();
  const entries = await parseUnicodeDirectory(html);

  // Filter entries where name starts with query (case-insensitive)
  const queryLower = query.toLowerCase();
  const matchingEntries = entries.filter((entry) =>
    entry.name.toLowerCase().startsWith(queryLower),
  );

  // Sort: files first, then directories
  const sortedEntries = matchingEntries.toSorted((a, b) => {
    // Files before directories
    if (a.type === "file" && b.type === "directory") return -1;
    if (a.type === "directory" && b.type === "file") return 1;
    // Maintain original order within same type
    return 0;
  });

  return c.json(sortedEntries, 200);
});

V1_FILES_ROUTER.openAPIRegistry.registerPath(WILDCARD_ROUTE);
V1_FILES_ROUTER.openAPIRegistry.registerPath(METADATA_WILDCARD_ROUTE);

V1_FILES_ROUTER.get("/:wildcard{.*}?", cache({
  cacheName: "ucdjs:v1_files:files",
  cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
}), async (c) => {
  const path = c.req.param("wildcard")?.trim() || "";

  // Validate path for path traversal attacks
  if (isInvalidPath(path)) {
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
  const lastModified = response.headers.get("Last-Modified") || undefined;
  const upstreamContentLength = response.headers.get("Content-Length") || undefined;
  const baseHeaders: Record<string, string> = {};
  if (lastModified) baseHeaders["Last-Modified"] = lastModified;

  const leaf = normalizedPath.split("/").pop() ?? "";
  const extName = leaf.includes(".") ? leaf.split(".").pop()!.toLowerCase() : "";
  const isHtmlFile = HTML_EXTENSIONS.includes(`.${extName}`);

  // check if this is a directory listing (HTML response for non-HTML files)
  const isDirectoryListing = contentType.includes("text/html") && !isHtmlFile;

  // eslint-disable-next-line no-console
  console.info(`[v1_files]: fetched content type: ${contentType} for .${extName} file`);
  if (isDirectoryListing) {
    const html = await response.text();
    let files = await parseUnicodeDirectory(html);

    // Apply pattern filter if provided
    const pattern = c.req.query("pattern");
    if (pattern) {
      // eslint-disable-next-line no-console
      console.info(`[v1_files]: applying glob pattern filter: ${pattern}`);
      if (!isValidGlobPattern(pattern, {
        maxLength: 128,
        maxSegments: 8,
        maxBraceExpansions: 8,
        maxStars: 16,
        maxQuestions: 16,
      })) {
        return badRequest({
          message: "Invalid glob pattern",
        });
      }

      const matcher = createGlobMatcher(pattern);
      files = files.filter((entry) => matcher(entry.name));
    }

    return c.json(files, 200, {
      ...baseHeaders,

      // Custom STAT Headers
      [UCD_FILE_STAT_TYPE_HEADER]: "directory",
    });
  }

  // eslint-disable-next-line no-console
  console.log(`[v1_files]: pre content type check: ${contentType} for .${extName} file`);
  contentType ||= determineContentTypeFromExtension(extName);
  // eslint-disable-next-line no-console
  console.log(`[v1_files]: inferred content type as ${contentType} for .${extName} file`);

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

const mimeTypes: Record<string, string> = {
  csv: "text/csv",
  xml: "application/xml",
  txt: "text/plain",
  pdf: "application/pdf",
  json: "application/json",
};

function determineContentTypeFromExtension(extName: string) {
  if (HTML_EXTENSIONS.includes(`.${extName}`)) {
    return "text/html";
  }

  return mimeTypes[extName] || "application/octet-stream";
}

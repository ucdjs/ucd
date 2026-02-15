import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { badGateway, badRequest, notFound } from "@ucdjs-internal/worker-utils";
import {
  DEFAULT_USER_AGENT,
} from "@ucdjs/env";
import { cache } from "hono/cache";
import { MAX_AGE_ONE_WEEK_SECONDS } from "../../constants";
import {
  applyDirectoryFiltersAndSort,
  determineFileExtension,
  handleDirectoryResponse,
  handleFileResponse,
  isDirectoryListing,
  parseUnicodeDirectory,
} from "../../lib/files";
import { determineContentTypeFromExtension, isInvalidPath } from "../../routes/v1_files/utils";
import { stripUCDPrefix, transformPathForUnicodeOrg } from "../lib/path-utils";

export function registerFilesRoute(router: OpenAPIHono<HonoEnv>) {
  router.get(
    "/:version/:filepath{.*}?",
    cache({
      cacheName: "ucdjs:ucd-store:files",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
    }),
    async (c) => {
      const version = c.req.param("version");
      const filepath = c.req.param("filepath")?.trim() || "";

      // Validate path
      if (isInvalidPath(filepath)) {
        return badRequest({
          message: "Invalid path",
        });
      }

      // Transform path for Unicode.org (adds /ucd/ if needed)
      const unicodeOrgPath = transformPathForUnicodeOrg(version, filepath);
      const url = `https://unicode.org/Public/${unicodeOrgPath}?F=2`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": DEFAULT_USER_AGENT },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return notFound(c, { message: "Resource not found" });
        }
        return badGateway(c);
      }

      let contentType = response.headers.get("content-type") || "";
      const lastModified = response.headers.get("Last-Modified") || undefined;
      const baseHeaders: Record<string, string> = {};
      if (lastModified) baseHeaders["Last-Modified"] = lastModified;

      const leaf = filepath.split("/").pop() ?? "";
      const extName = determineFileExtension(leaf);
      const isDir = isDirectoryListing(contentType, extName);

      if (isDir) {
        const html = await response.text();
        const parsedFiles = await parseUnicodeDirectory(html, `/${version}/${filepath}`);

        // Transform paths to remove /ucd/ prefix
        const transformedFiles = parsedFiles.map((file) => ({
          ...file,
          path: stripUCDPrefix(file.path),
        }));

        // Apply filters
        const files = applyDirectoryFiltersAndSort(transformedFiles, {
          query: c.req.query("query"),
          pattern: c.req.query("pattern"),
          type: c.req.query("type"),
          sort: c.req.query("sort"),
          order: c.req.query("order"),
        });

        return handleDirectoryResponse(c, {
          files,
          baseHeaders,
        });
      }

      // Handle file response
      contentType ||= determineContentTypeFromExtension(extName);
      const isHeadRequest = c.req.method === "HEAD";

      return await handleFileResponse(c, {
        contentType,
        baseHeaders,
        response,
        isHeadRequest,
      });
    },
  );
}

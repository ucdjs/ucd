/* eslint-disable no-console */
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import {
  DEFAULT_USER_AGENT,
  UCD_STAT_CHILDREN_DIRS_HEADER,
  UCD_STAT_CHILDREN_FILES_HEADER,
  UCD_STAT_CHILDREN_HEADER,
  UCD_STAT_SIZE_HEADER,
  UCD_STAT_TYPE_HEADER,
} from "@ucdjs/env";
import { cache } from "hono/cache";
import { HTML_EXTENSIONS, MAX_AGE_ONE_WEEK_SECONDS } from "../../constants";
import { badGateway, badRequest, notFound } from "../../lib/errors";
import { applyDirectoryFiltersAndSort, parseUnicodeDirectory } from "../../lib/files";
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

      console.info(`[ucd-store]: fetching ${url}`);

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
      const extName = leaf.includes(".") ? leaf.split(".").pop()!.toLowerCase() : "";
      const isHtmlFile = HTML_EXTENSIONS.includes(`.${extName}`);
      const isDirectoryListing = contentType.includes("text/html") && !isHtmlFile;

      if (isDirectoryListing) {
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

        return c.json(files, 200, {
          ...baseHeaders,
          [UCD_STAT_TYPE_HEADER]: "directory",
          [UCD_STAT_CHILDREN_HEADER]: `${files.length}`,
          [UCD_STAT_CHILDREN_FILES_HEADER]: `${files.filter((f) => f.type === "file").length}`,
          [UCD_STAT_CHILDREN_DIRS_HEADER]: `${files.filter((f) => f.type === "directory").length}`,
        });
      }

      // Handle file response
      contentType ||= determineContentTypeFromExtension(extName);

      const isHeadRequest = c.req.method === "HEAD";
      if (isHeadRequest) {
        const blob = await response.blob();
        return c.newResponse(null, 200, {
          "Content-Type": contentType,
          ...baseHeaders,
          [UCD_STAT_TYPE_HEADER]: "file",
          [UCD_STAT_SIZE_HEADER]: `${blob.size}`,
          "Content-Length": `${blob.size}`,
        });
      }

      return c.newResponse(response.body, 200, {
        "Content-Type": contentType,
        ...baseHeaders,
        [UCD_STAT_TYPE_HEADER]: "file",
      });
    },
  );
}

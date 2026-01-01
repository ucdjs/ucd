import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute, z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { createGlobMatcher, isValidGlobPattern } from "@ucdjs-internal/shared";
import {
  DEFAULT_USER_AGENT,
  UCD_STAT_CHILDREN_DIRS_HEADER,
  UCD_STAT_CHILDREN_FILES_HEADER,
  UCD_STAT_CHILDREN_HEADER,
  UCD_STAT_SIZE_HEADER,
  UCD_STAT_TYPE_HEADER,
} from "@ucdjs/env";
import { FileEntryListSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { HTML_EXTENSIONS, MAX_AGE_ONE_WEEK_SECONDS } from "../../constants";
import { badGateway, badRequest, notFound } from "../../lib/errors";
import { parseUnicodeDirectory } from "../../lib/files";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import {
  ORDER_QUERY_PARAM,
  PATTERN_QUERY_PARAM,
  QUERY_PARAM,
  SORT_QUERY_PARAM,
  TYPE_QUERY_PARAM,
  WILDCARD_PARAM,
} from "./openapi-params";
import { determineContentTypeFromExtension, isInvalidPath } from "./utils";

export const WILDCARD_ROUTE = createRoute({
  method: "get",
  path: "/{wildcard}",
  tags: [OPENAPI_TAGS.FILES],
  parameters: [
    WILDCARD_PARAM,
    PATTERN_QUERY_PARAM,
    QUERY_PARAM,
    TYPE_QUERY_PARAM,
    SORT_QUERY_PARAM,
    ORDER_QUERY_PARAM,
  ],
  description: dedent`
    This endpoint proxies your request directly to Unicode.org, allowing you to access any file or directory under the Unicode Public directory structure with only slight [modifications](#tag/files/get/api/v1/files/{wildcard}/description/modifications).

    > [!IMPORTANT]
    > The \`{wildcard}\` parameter can be any valid path, you are even allowed to use nested paths like \`15.1.0/ucd/emoji/emoji-data.txt\`.

    > [!NOTE]
    > If you wanna access only some metadata about the path, you can use a \`HEAD\` request instead. See [here](#tag/files/head/api/v1/files/{wildcard})

    ### Directory Listing Features

    When accessing a directory, you can use the following query parameters to filter and sort the results:

    - \`query\` - Prefix-based search (case-insensitive) on entry names
    - \`pattern\` - Glob pattern matching for more complex filtering
    - \`type\` - Filter by entry type: \`all\` (default), \`files\`, or \`directories\`
    - \`sort\` - Sort by \`name\` (default) or \`lastModified\`
    - \`order\` - Sort order: \`asc\` (default) or \`desc\`

    ### Modifications

    We are doing a slight modification to the response, only if the response is for a directory.
    If you request a directory, we will return a JSON listing of the files and subdirectories in that directory.
  `,
  responses: {
    200: {
      description: "Response from Unicode.org",
      headers: {
        [UCD_STAT_TYPE_HEADER]: {
          description: "The type of the file or directory",
          schema: {
            type: "string",
            enum: ["file", "directory"],
          },
          required: true,
        },
        [UCD_STAT_SIZE_HEADER]: {
          description: "The size of the file in bytes (only for files)",
          schema: {
            type: "string",
          },
          required: false,
        },
        [UCD_STAT_CHILDREN_HEADER]: {
          description: "Number of children (only for directories)",
          schema: {
            type: "string",
          },
          required: false,
        },
        [UCD_STAT_CHILDREN_FILES_HEADER]: {
          description: "Number of child files (only for directories)",
          schema: {
            type: "string",
          },
          required: false,
        },
        [UCD_STAT_CHILDREN_DIRS_HEADER]: {
          description: "Number of child directories (only for directories)",
          schema: {
            type: "string",
          },
          required: false,
        },
      },
      content: {
        "application/json": {
          schema: FileEntryListSchema,
          examples: {
            default: {
              summary: "A directory with entries",
              value: [
                {
                  type: "file",
                  name: "ReadMe.txt",
                  path: "ReadMe.txt",
                  lastModified: 1693213740000,
                },
                {
                  type: "directory",
                  name: "charts",
                  path: "charts",
                  lastModified: 1697495340000,
                },
              ],
            },
          },
        },
        "application/xml": {
          schema: z.string(),
        },
        "text/plain": {
          schema: z.string(),
          examples: {
            "15.0.0/ucd/UnicodeData.txt": {
              summary: "UnicodeData.txt for Unicode 15.0.0",
              value: dedent`
                0000;<control>;Cc;0;BN;;;;;N;NULL;;;;
                0001;<control>;Cc;0;BN;;;;;N;START OF HEADING;;;;
                0002;<control>;Cc;0;BN;;;;;N;START OF TEXT;;;;
                0003;<control>;Cc;0;BN;;;;;N;END OF TEXT;;;;
                0004;<control>;Cc;0;BN;;;;;N;END OF TRANSMISSION;;;;
                0005;<control>;Cc;0;BN;;;;;N;ENQUIRY;;;;
                0006;<control>;Cc;0;BN;;;;;N;ACKNOWLEDGE;;;;
              `,
            },
            "15.1.0/ucd/emoji/emoji-data.txt": {
              summary: "Emoji data file for Unicode 15.1.0",
              value: dedent`
                265F          ; Emoji                # E11.0  [1] (♟️)       chess pawn
                2660          ; Emoji                # E0.6   [1] (♠️)       spade suit
                2663          ; Emoji                # E0.6   [1] (♣️)       club suit
                2665..2666    ; Emoji                # E0.6   [2] (♥️..♦️)    heart suit..diamond suit
              `,
            },
          },
        },
        "text/html": {
          schema: z.string(),
        },
        "application/pdf": {
          schema: {
            format: "binary",
            type: "string",
          },
        },
        "application/octet-stream": {
          schema: {
            format: "binary",
            type: "string",
          },
        },
      },
    },
    ...(generateReferences([
      400,
      404,
      500,
      502,
    ])),
  },
});

export const METADATA_WILDCARD_ROUTE = createRoute({
  method: "head",
  path: "/{wildcard}",
  tags: [OPENAPI_TAGS.FILES],
  parameters: [
    WILDCARD_PARAM,
    PATTERN_QUERY_PARAM,
    QUERY_PARAM,
    TYPE_QUERY_PARAM,
    SORT_QUERY_PARAM,
    ORDER_QUERY_PARAM,
  ],
  description: dedent`
    This endpoint returns metadata about the requested file or directory without fetching the entire content.
    It is useful for checking the existence of a file or directory and retrieving its metadata without downloading
    the content.

    > [!NOTE]
    > The \`HEAD\` request will return the same headers as a \`GET\` request, but without the body.
    > This means you can use it to check if a file exists or to get metadata like the last modified date, size, etc.
  `,
  responses: {
    200: {
      description: "Response from Unicode.org",
      headers: {
        [UCD_STAT_TYPE_HEADER]: {
          description: "The type of the file or directory",
          schema: {
            type: "string",
            enum: ["file", "directory"],
          },
          required: true,
        },
        [UCD_STAT_SIZE_HEADER]: {
          description: "The size of the file in bytes (only for files)",
          schema: {
            type: "string",
          },
          required: false,
        },
        [UCD_STAT_CHILDREN_HEADER]: {
          description: "Number of children (only for directories)",
          schema: {
            type: "string",
          },
          required: false,
        },
        [UCD_STAT_CHILDREN_FILES_HEADER]: {
          description: "Number of child files (only for directories)",
          schema: {
            type: "string",
          },
          required: false,
        },
        [UCD_STAT_CHILDREN_DIRS_HEADER]: {
          description: "Number of child directories (only for directories)",
          schema: {
            type: "string",
          },
          required: false,
        },
        "Content-Type": {
          description: "The content type of the file",
          schema: {
            type: "string",
          },
          required: true,
        },
        "Last-Modified": {
          description: "Last modification time from upstream",
          schema: { type: "string" },
          required: false,
        },
        "Content-Length": {
          description: "Byte length when applicable",
          schema: { type: "string" },
          required: false,
        },
      },
    },
  },
});

export function registerWildcardRoute(router: OpenAPIHono<HonoEnv>) {
  router.openAPIRegistry.registerPath(WILDCARD_ROUTE);
  router.openAPIRegistry.registerPath(METADATA_WILDCARD_ROUTE);

  router.get("/:wildcard{.*}?", cache({
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
      let files = await parseUnicodeDirectory(html, normalizedPath);

      // Get query parameters for filtering and sorting
      const query = c.req.query("query");
      const pattern = c.req.query("pattern");
      const type = c.req.query("type") || "all";
      const sort = c.req.query("sort") || "name";
      const order = c.req.query("order") || "asc";

      // Apply query filter (prefix search, case-insensitive)
      if (query) {
        // eslint-disable-next-line no-console
        console.info(`[v1_files]: applying query filter: ${query}`);
        const queryLower = query.toLowerCase();
        files = files.filter((entry) => entry.name.toLowerCase().startsWith(queryLower));
      }

      // Apply pattern filter if provided
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

      // Apply type filter
      if (type === "files") {
        files = files.filter((entry) => entry.type === "file");
      } else if (type === "directories") {
        files = files.filter((entry) => entry.type === "directory");
      }

      // Apply sorting (directories always first, like Windows File Explorer)
      // Within each group, items are sorted by the requested field and order
      files = files.toSorted((a, b) => {
        // Directories always come first
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }

        // Within same type, apply the requested sort
        let comparison: number;

        if (sort === "lastModified") {
          // lastModified is always available from parseUnicodeDirectory
          comparison = (a.lastModified ?? 0) - (b.lastModified ?? 0);
        } else {
          // Natural name sorting (numeric aware) so 2.0.0 < 10.0.0
          comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
        }

        return order === "desc" ? -comparison : comparison;
      });

      return c.json(files, 200, {
        ...baseHeaders,

        // Custom STAT Headers
        [UCD_STAT_TYPE_HEADER]: "directory",
        [UCD_STAT_CHILDREN_HEADER]: `${files.length}`,
        [UCD_STAT_CHILDREN_FILES_HEADER]: `${files.filter((f) => f.type === "file").length}`,
        [UCD_STAT_CHILDREN_DIRS_HEADER]: `${files.filter((f) => f.type === "directory").length}`,
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
      [UCD_STAT_TYPE_HEADER]: "file",
      [UCD_STAT_SIZE_HEADER]: upstreamContentLength || "0",
    };

    const cd = response.headers.get("Content-Disposition");
    if (cd) headers["Content-Disposition"] = cd;
    if (upstreamContentLength) headers["Content-Length"] = upstreamContentLength;

    return c.newResponse(response.body!, 200, headers);
  });
}

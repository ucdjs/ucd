import type { UnicodeAssetOptions } from "#lib/files";
import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { StatusCode } from "hono/utils/http-status";
import { getUnicodeAsset } from "#lib/files";
import { createRoute, z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { customError, MAX_AGE_ONE_WEEK_SECONDS } from "@ucdjs-internal/worker-utils";
import {
  UCD_STAT_CHILDREN_DIRS_HEADER,
  UCD_STAT_CHILDREN_FILES_HEADER,
  UCD_STAT_CHILDREN_HEADER,
  UCD_STAT_SIZE_HEADER,
  UCD_STAT_TYPE_HEADER,
} from "@ucdjs/env";
import { FileEntryListSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import {
  ORDER_QUERY_PARAM,
  PATTERN_QUERY_PARAM,
  QUERY_PARAM,
  SORT_QUERY_PARAM,
  TYPE_QUERY_PARAM,
  WILDCARD_PARAM,
} from "./openapi-params";

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
    This endpoint proxies requests to Unicode.org's Public directory, streaming files directly while transforming directory listings into structured JSON.

    All paths are relative to \`/api/v1/files\` — for example, requesting \`/api/v1/files/15.1.0/ucd/emoji/emoji-data.txt\` fetches the emoji data file from Unicode version 15.1.0.

    > [!IMPORTANT]
    > The \`{wildcard}\` parameter accepts any valid path, including deeply nested ones like \`15.1.0/ucd/emoji/emoji-data.txt\`. In directory listing responses, paths for directories include a trailing slash (e.g., \`/15.1.0/ucd/charts/\`), while file paths do not.

    > [!NOTE]
    > To retrieve only metadata without downloading content, use a \`HEAD\` request instead. See [here](#tag/files/head/api/v1/files/{wildcard})

    ### Directory Listing Features

    When accessing a directory, you can filter and sort entries using these query parameters:

    - \`query\` - Prefix-based search (case-insensitive) on entry names
    - \`pattern\` - Glob pattern matching for filtering
    - \`type\` - Filter by entry type: \`all\` (default), \`files\`, or \`directories\`
    - \`sort\` - Sort by \`name\` (default) or \`lastModified\`
    - \`order\` - Sort order: \`asc\` (default) or \`desc\`

    ### Modifications

    Directory responses are automatically transformed into JSON arrays containing file and directory entries. Files are streamed directly from Unicode.org with appropriate content types.
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
                  path: "/15.1.0/ucd/ReadMe.txt",
                  lastModified: 1693213740000,
                },
                {
                  type: "directory",
                  name: "charts",
                  path: "/15.1.0/ucd/charts/",
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
              `.trim(),
            },
            "15.1.0/ucd/emoji/emoji-data.txt": {
              summary: "Emoji data file for Unicode 15.1.0",
              value: dedent`
                265F          ; Emoji                # E11.0  [1] (♟️)       chess pawn
                2660          ; Emoji                # E0.6   [1] (♠️)       spade suit
                2663          ; Emoji                # E0.6   [1] (♣️)       club suit
                2665..2666    ; Emoji                # E0.6   [2] (♥️..♦️)    heart suit..diamond suit
              `.trim(),
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
    Retrieve metadata about a file or directory without downloading the content. Useful for checking existence, file size, and other metadata.

    All paths are relative to \`/api/v1/files\`. Directory paths always include a trailing slash (e.g., \`/15.1.0/ucd/charts/\`), while file paths do not.

    > [!NOTE]
    > This endpoint returns the same headers as the \`GET\` request (file size, directory entry counts, last modified timestamps, content type) without the response body.
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
          required: true,
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
          required: true,
        },
      },
    },
  },
});

export function registerWildcardRoute(router: OpenAPIHono<HonoEnv>) {
  router.openAPIRegistry.registerPath(WILDCARD_ROUTE);
  router.openAPIRegistry.registerPath(METADATA_WILDCARD_ROUTE);

  router.get(
    "/:wildcard{.*}?",
    cache({
      cacheName: (c) => `ucdjs:v1_files:files${c.req.method === "HEAD" ? ":head" : ":get"}`,
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
    }),
    async (c) => {
      const path = c.req.param("wildcard")?.trim() || "";
      const handlerOptions = {
        query: c.req.query("query"),
        pattern: c.req.query("pattern"),
        type: c.req.query("type"),
        sort: c.req.query("sort"),
        order: c.req.query("order"),
        isHeadRequest: c.req.method === "HEAD",
      } satisfies UnicodeAssetOptions;

      const {
        body,
        headers,
        status,
      } = await getUnicodeAsset(path, handlerOptions);

      if (status !== 200) {
        return customError(c, {
          status,
          message: `Upstream responded with status ${status}`,
          headers,
        });
      }

      return c.newResponse(body, status as StatusCode, headers);
    },
  );
}

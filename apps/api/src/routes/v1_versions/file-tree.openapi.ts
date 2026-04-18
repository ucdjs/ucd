import type { UnicodeFileTree } from "@ucdjs/schemas";
import { VERSION_ROUTE_PARAM } from "#lib/shared-parameters";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { MAX_AGE_ONE_WEEK_SECONDS } from "@ucdjs-internal/worker-utils";
import { UnicodeFileTreeSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { V1_VERSIONS_FILE_TREE_CACHE_NAME } from "../../constants";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";

const GET_VERSION_FILE_TREE_ROUTE_DOCS = dedent`
  This endpoint provides a **structured list of all files** inside the [\`ucd folder\`](https://unicode.org/Public/UCD/latest/ucd) associated with a specific Unicode version.

  For older versions, the files are retrieved without the \`/ucd\` prefix, while for the latest version, the \`/ucd\` prefix is included.
`;

export const GET_VERSION_FILE_TREE_ROUTE = createRoute({
  "method": "get",
  "path": "/{version}/file-tree",
  "operationId": "getVersionFileTree",
  "x-ucd-client-method": "versions.getFileTree",
  "tags": [OPENAPI_TAGS.VERSIONS],
  "middleware": [
    cache({
      cacheName: V1_VERSIONS_FILE_TREE_CACHE_NAME,
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 1 week
    }),
  ],
  "parameters": [
    VERSION_ROUTE_PARAM,
  ],
  "description": GET_VERSION_FILE_TREE_ROUTE_DOCS,
  "responses": {
    200: {
      content: {
        "application/json": {
          schema: UnicodeFileTreeSchema,
          examples: {
            default: {
              summary: "File tree for a Unicode version",
              value: [
                {
                  type: "file",
                  name: "ArabicShaping.txt",
                  path: "/17.0.0/ucd/ArabicShaping.txt",
                  lastModified: 1724601900000,
                },
                {
                  type: "file",
                  name: "BidiBrackets.txt",
                  path: "/17.0.0/ucd/BidiBrackets.txt",
                  lastModified: 1724601900000,
                },
                {
                  type: "directory",
                  name: "emoji",
                  path: "/17.0.0/ucd/emoji/",
                  lastModified: 1724669760000,
                  children: [
                    {
                      type: "file",
                      name: "ReadMe.txt",
                      path: "/17.0.0/ucd/emoji/ReadMe.txt",
                      lastModified: 1724601900000,
                    },
                    {
                      type: "file",
                      name: "emoji-data.txt",
                      path: "/17.0.0/ucd/emoji/emoji-data.txt",
                      lastModified: 1724601900000,
                    },
                  ],
                },
              ] satisfies UnicodeFileTree,
            },
          },
        },
      },
      description: "Structured list of files for a Unicode version",
    },
    ...(generateReferences([
      400,
      429,
      500,
      502,
    ])),
  },
});

import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { createDebugger } from "@ucdjs-internal/shared";
import { UnicodeTreeSchema } from "@ucdjs/schemas";
import {
  hasUCDFolderPath,
  resolveUCDVersion,
  UNICODE_STABLE_VERSION,
  UNICODE_VERSION_METADATA,
} from "@unicode-utils/core";
import { traverse } from "apache-autoindex-parse/traverse";
import { cache } from "hono/cache";
import { MAX_AGE_ONE_WEEK_SECONDS } from "../../../constants";
import { badRequest, internalServerError } from "../../../lib/errors";
import { VERSION_ROUTE_PARAM } from "../../../lib/shared-parameters";
import { generateReferences, OPENAPI_TAGS } from "../../../openapi";

const debug = createDebugger("ucdjs:api:v1_versions:file-tree");

const GET_VERSION_FILE_TREE_ROUTE = createRoute({
  method: "get",
  path: "/{version}/file-tree",
  tags: [OPENAPI_TAGS.VERSIONS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_versions:file-tree",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 1 week
    }),
  ],
  parameters: [
    VERSION_ROUTE_PARAM,
  ],
  description: dedent`
    This endpoint provides a **structured list of all files** inside the [\`ucd folder\`](https://unicode.org/Public/UCD/latest/ucd) associated with a specific Unicode version.

    For older versions, the files are retrieved without the \`/ucd\` prefix, while for the latest version, the \`/ucd\` prefix is included.
`,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeTreeSchema,
          examples: {
            default: {
              summary: "File tree for a Unicode version",
              value: [
                {
                  type: "file",
                  name: "ArabicShaping.txt",
                  path: "ArabicShaping.txt",
                  lastModified: 1724601900000,
                },
                {
                  type: "file",
                  name: "BidiBrackets.txt",
                  path: "BidiBrackets.txt",
                  lastModified: 1724601900000,
                },
                {
                  type: "directory",
                  name: "emoji",
                  path: "emoji",
                  lastModified: 1724669760000,
                  children: [
                    {
                      type: "file",
                      name: "ReadMe.txt",
                      path: "ReadMe.txt",
                      lastModified: 1724601900000,
                    },
                    {
                      type: "file",
                      name: "emoji-data.txt",
                      path: "emoji-data.txt",
                      lastModified: 1724601900000,
                    },
                  ],
                },
              ],
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

export function registerVersionFileTreeRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_VERSION_FILE_TREE_ROUTE, async (c) => {
    try {
      let version = c.req.param("version");

      if (version === "latest") {
        debug?.(`Resolving 'latest' to stable version ${UNICODE_STABLE_VERSION}`);
        version = UNICODE_STABLE_VERSION;
      }

      const mappedVersion = resolveUCDVersion(version);

      if (
        !UNICODE_VERSION_METADATA.map((v) => v.version)
          .includes(version as typeof UNICODE_VERSION_METADATA[number]["version"])) {
        return badRequest(c, {
          message: "Invalid Unicode version",
        });
      }

      const normalizedPath = `${mappedVersion}${hasUCDFolderPath(mappedVersion) ? "/ucd" : ""}`;

      const result = await traverse(`https://unicode.org/Public/${normalizedPath}`, {
        format: "F2",
        basePath: normalizedPath,
      });

      return c.json(result, 200);
    } catch (error) {
      console.error("Error processing directory:", error);
      return internalServerError(c, {
        message: "Failed to fetch file mappings",
      });
    }
  });
}

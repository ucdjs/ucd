import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { UnicodeFileTreeNodeSchema, UnicodeFileTreeSchema, UnicodeVersionDetailsSchema } from "@ucdjs/schemas";
import {
  hasUCDFolderPath,
  resolveUCDVersion,
  UNICODE_STABLE_VERSION,
  UNICODE_VERSION_METADATA,
} from "@unicode-utils/core";
import { traverse } from "apache-autoindex-parse/traverse";
import { cache } from "hono/cache";
import { MAX_AGE_ONE_DAY_SECONDS, MAX_AGE_ONE_WEEK_SECONDS } from "../../constants";
import { badGateway, badRequest, internalServerError, notFound } from "../../lib/errors";
import { createLogger } from "../../lib/logger";
import { captureUpstreamError, COMPONENTS } from "../../lib/sentry";
import { VERSION_ROUTE_PARAM } from "../../lib/shared-parameters";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { calculateStatistics, getVersionFromList } from "./utils";

const log = createLogger("ucd:api:v1_versions");

const GET_VERSION_FILE_TREE_ROUTE_DOCS = dedent`
    This endpoint provides a **structured list of all files** inside the [\`ucd folder\`](https://unicode.org/Public/UCD/latest/ucd) associated with a specific Unicode version.

    For older versions, the files are retrieved without the \`/ucd\` prefix, while for the latest version, the \`/ucd\` prefix is included.
`;

const GET_VERSION_ROUTE = createRoute({
  method: "get",
  path: "/{version}",
  tags: [OPENAPI_TAGS.VERSIONS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_versions:version",
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS * 4}`, // 4 days
    }),
  ],
  parameters: [
    VERSION_ROUTE_PARAM,
  ],
  description: dedent`
    ## Get Unicode Version Details

    This endpoint retrieves detailed information about a specific Unicode version.

    - Provides **version metadata** such as version name, documentation URL, release date, and type (stable/draft)
    - Includes **location information** (UCD URL and mapped version)
    - Returns **statistics** about characters, blocks, and scripts (if available)
    - Supports **caching** for performance optimization
  `,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeVersionDetailsSchema,
          examples: {
            default: {
              summary: "Unicode version details",
              value: {
                version: "16.0.0",
                documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
                date: "2024",
                url: "https://www.unicode.org/Public/16.0.0",
                mappedUcdVersion: null,
                type: "stable",
                statistics: {
                  totalCharacters: 149813,
                  newCharacters: 5185,
                  totalBlocks: 331,
                  newBlocks: 4,
                  totalScripts: 165,
                  newScripts: 2,
                },
              },
            },
          },
        },
      },
      description: "Detailed information about a Unicode version",
    },
    ...(generateReferences([
      400,
      404,
      429,
      502,
      500,
    ])),
  },
});

export const GET_VERSION_FILE_TREE_ROUTE = createRoute({
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
  description: GET_VERSION_FILE_TREE_ROUTE_DOCS,
  responses: {
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

export function registerGetVersionRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_VERSION_ROUTE, async (c) => {
    let version = c.req.param("version");

    if (version === "latest") {
      version = UNICODE_STABLE_VERSION;
    }

    if (
      !UNICODE_VERSION_METADATA.map((v) => v.version)
        .includes(version as typeof UNICODE_VERSION_METADATA[number]["version"])) {
      return badRequest(c, {
        message: "Invalid Unicode version",
      });
    }

    const [versionInfo, error] = await getVersionFromList(version);

    // If there's an error (upstream service failure), return 502
    if (error) {
      log.error("Error fetching version from upstream service", { error });
      captureUpstreamError(error, {
        component: COMPONENTS.V1_VERSIONS,
        operation: "getVersionFromList",
        upstreamService: "unicode.org",
        context: c,
        tags: {
          requested_version: version,
        },
        extra: {
          version,
        },
      });
      return badGateway(c, {
        message: "Failed to fetch Unicode version from upstream service",
      });
    }

    // If versionInfo is null but no error, it means version not found
    if (!versionInfo) {
      return notFound(c, {
        message: "Unicode version not found",
      });
    }

    // Try to get statistics from bucket if available
    const bucket = c.env.UCD_BUCKET;
    let statistics = null;
    if (bucket) {
      statistics = await calculateStatistics(bucket, version);
    }

    return c.json({
      ...versionInfo,
      statistics: statistics ?? undefined,
    }, 200);
  });
}

export function registerVersionFileTreeRoute(router: OpenAPIHono<HonoEnv>) {
  router.openAPIRegistry.register("UnicodeFileTreeNode", UnicodeFileTreeNodeSchema);
  router.openapi(GET_VERSION_FILE_TREE_ROUTE, async (c) => {
    try {
      let version = c.req.param("version");

      if (version === "latest") {
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

      const result = await traverse(`https://unicode.org/Public/${mappedVersion}${hasUCDFolderPath(mappedVersion) ? "/ucd" : ""}`, {
        format: "F2",
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

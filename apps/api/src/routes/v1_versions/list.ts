import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { UnicodeVersionListSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { MAX_AGE_ONE_DAY_SECONDS } from "../../constants";
import { internalServerError } from "../../lib/errors";
import { createLogger } from "../../lib/logger";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { getAllVersionsFromList } from "./utils";

const log = createLogger("ucd:api:v1_versions");

const LIST_ALL_UNICODE_VERSIONS_ROUTE_DOCS = dedent`
    ## List All Unicode Versions

    This endpoint retrieves a comprehensive list of all Unicode versions, including metadata and support status.

    - Provides **version metadata** such as documentation URLs and public URLs
    - Includes **draft versions** if available
    - Supports **caching** for performance optimization
`;

export const LIST_ALL_UNICODE_VERSIONS_ROUTE = createRoute({
  method: "get",
  path: "/",
  tags: [OPENAPI_TAGS.VERSIONS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_versions:list",
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS * 4}`, // 4 days
    }),
  ],
  description: LIST_ALL_UNICODE_VERSIONS_ROUTE_DOCS,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeVersionListSchema,
          examples: {
            default: {
              summary: "Multiple Unicode versions",
              value: [
                {
                  version: "17.0.0",
                  documentationUrl: "https://www.unicode.org/versions/Unicode17.0.0/",
                  date: null,
                  url: "https://www.unicode.org/Public/17.0.0",
                  mappedUcdVersion: null,
                  type: "draft",
                },
                {
                  version: "16.0.0",
                  documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
                  date: "2024",
                  url: "https://www.unicode.org/Public/16.0.0",
                  mappedUcdVersion: null,
                  type: "stable",
                },
                {
                  version: "15.1.0",
                  documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
                  date: "2023",
                  url: "https://www.unicode.org/Public/15.1.0",
                  mappedUcdVersion: null,
                  type: "stable",
                },
              ],
            },
          },
        },
      },
      description: "List of Unicode Versions",
    },
    ...(generateReferences([
      404,
      429,
      500,
    ])),
  },
});

export function registerListVersionsRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(LIST_ALL_UNICODE_VERSIONS_ROUTE, async (c) => {
    try {
      log.info("Fetching unicode html versions page");

      const versions = await getAllVersionsFromList();

      if (versions.length === 0) {
        log.error("Failed to fetch Unicode versions page or no versions found");
        return internalServerError(c, {
          message: "Failed to fetch Unicode versions",
        });
      }

      log.info("Successfully fetched Unicode versions", { count: versions.length });
      return c.json(versions, 200);
    } catch (err) {
      log.error("Error fetching Unicode versions", { error: err });
      return internalServerError(c);
    }
  });
}

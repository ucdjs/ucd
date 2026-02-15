import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { badGateway } from "@ucdjs-internal/worker-utils";
import { UnicodeVersionListSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { MAX_AGE_ONE_DAY_SECONDS } from "../../constants";
import { createLogger } from "../../lib/logger";
import { captureError, captureUpstreamError, COMPONENTS } from "../../lib/sentry";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { getAllVersionsFromList } from "./utils";

const log = createLogger("ucd:api:v1_versions");

const LIST_ALL_UNICODE_VERSIONS_ROUTE = createRoute({
  method: "get",
  path: "/",
  tags: [OPENAPI_TAGS.VERSIONS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_versions:list",
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS * 4}`, // 4 days
    }),
  ],
  description: dedent`
    ## List All Unicode Versions

    This endpoint retrieves a comprehensive list of all Unicode versions, including metadata and support status.

    - Provides **version metadata** such as documentation URLs and public URLs
    - Includes **draft versions** if available
    - Supports **caching** for performance optimization
  `,
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
      502,
      500,
    ])),
  },
});

export function registerListVersionsRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(LIST_ALL_UNICODE_VERSIONS_ROUTE, async (c) => {
    log.info("Fetching unicode html versions page");

    const [versions, error] = await getAllVersionsFromList();

    if (error) {
      log.error("Error fetching Unicode versions", { error });
      captureUpstreamError(error, {
        component: COMPONENTS.V1_VERSIONS,
        operation: "getAllVersionsFromList",
        upstreamService: "unicode.org",
        context: c,
      });

      return badGateway(c, {
        message: "Failed to fetch Unicode versions from upstream service",
      });
    }

    if (!versions || versions.length === 0) {
      log.error("No versions found after successful fetch");
      const emptyResultError = new Error("No Unicode versions found after successful fetch from enumerated page");
      captureError(emptyResultError, {
        component: COMPONENTS.V1_VERSIONS,
        operation: "getAllVersionsFromList",
        context: c,
        tags: {
          issue_type: "empty_result",
        },
        extra: {
          versions_count: versions?.length ?? 0,
        },
      });

      return badGateway(c, {
        message: "No Unicode versions found",
      });
    }

    log.info("Successfully fetched Unicode versions", { count: versions.length });
    return c.json(versions, 200);
  });
}

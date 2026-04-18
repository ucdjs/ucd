import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { createDatabase } from "#db";
import { versions } from "#db/schema";
import { createLogger } from "#lib/logger";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { MAX_AGE_ONE_DAY_SECONDS } from "@ucdjs-internal/worker-utils";
import { UnicodeVersionListSchema } from "@ucdjs/schemas";
import { desc } from "drizzle-orm";
import { cache } from "hono/cache";
import { V1_VERSIONS_LIST_CACHE_NAME } from "../../constants";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";

const log = createLogger("ucd:api:v1_versions");

const LIST_ALL_UNICODE_VERSIONS_ROUTE = createRoute({
  method: "get",
  path: "/",
  operationId: "listVersions",
  "x-ucd-client-method": "versions.list",
  tags: [OPENAPI_TAGS.VERSIONS],
  middleware: [
    cache({
      cacheName: V1_VERSIONS_LIST_CACHE_NAME,
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS * 4}`, // 4 days
    }),
  ],
  description: dedent`
    ## List Supported Unicode Versions

    This endpoint retrieves the Unicode versions currently supported by UCD.js.

    - Provides **version metadata** such as documentation URLs and public URLs
    - Includes **draft versions** when they are published and supported
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
      500,
    ])),
  },
});

export function registerListVersionsRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(LIST_ALL_UNICODE_VERSIONS_ROUTE, async (c) => {
    const db = createDatabase(c.env.UCD_DATA);
    const supportedVersions = await db
      .select({
        version: versions.version,
        documentationUrl: versions.documentationUrl,
        date: versions.date,
        url: versions.url,
        mappedUcdVersion: versions.mappedUcdVersion,
        type: versions.status,
      })
      .from(versions)
      .orderBy(desc(versions.major), desc(versions.minor), desc(versions.patch));

    log.info("Serving supported Unicode versions from D1", { count: supportedVersions.length });
    return c.json(supportedVersions, 200);
  });
}

import { VERSION_ROUTE_PARAM } from "#lib/shared-parameters";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { MAX_AGE_ONE_DAY_SECONDS } from "@ucdjs-internal/worker-utils";
import { UnicodeVersionDetailsSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { V1_VERSIONS_DETAIL_CACHE_NAME } from "../../constants";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";

export const GET_VERSION_ROUTE = createRoute({
  "method": "get",
  "path": "/{version}",
  "operationId": "getVersion",
  "x-ucd-client-method": "versions.get",
  "tags": [OPENAPI_TAGS.VERSIONS],
  "middleware": [
    cache({
      cacheName: V1_VERSIONS_DETAIL_CACHE_NAME,
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS * 4}`, // 4 days
    }),
  ],
  "parameters": [
    VERSION_ROUTE_PARAM,
  ],
  "description": dedent`
    ## Get Unicode Version Details

    This endpoint retrieves detailed information about a specific Unicode version.

    - Provides **version metadata** such as version name, documentation URL, release date, and type (stable/draft)
    - Includes **location information** (UCD URL and mapped version)
    - Returns **statistics** about characters, blocks, and scripts (if available)
    - Supports **caching** for performance optimization
  `,
  "responses": {
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

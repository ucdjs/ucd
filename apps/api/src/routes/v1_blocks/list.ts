import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { UnicodeBlockListSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { z } from "zod";
import { MAX_AGE_ONE_DAY_SECONDS } from "../../constants";
import { internalServerError } from "../../lib/errors";
import { createLogger } from "../../lib/logger";
import { VERSION_ROUTE_PARAM } from "../../lib/shared-parameters";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";

const log = createLogger("ucd:api:v1_blocks");

const GET_BLOCKS_LIST_ROUTE = createRoute({
  method: "get",
  path: "/{version}",
  tags: [OPENAPI_TAGS.BLOCKS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_blocks:list",
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS * 7}`, // 7 days
    }),
  ],
  parameters: [
    VERSION_ROUTE_PARAM,
  ],
  description: dedent`
    ## List All Unicode Blocks

    Retrieve a complete list of all Unicode blocks with their basic information.

    - Returns **all Unicode blocks** with names and codepoint ranges
    - Includes **character counts** for each block
    - Supports **caching** with longer TTL for performance
  `,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeBlockListSchema,
          examples: {
            default: {
              summary: "List of Unicode blocks",
              value: [
                {
                  name: "Basic Latin",
                  range: { start: "U+0000", end: "U+007F" },
                  count: 128,
                  relatedScripts: ["Latin"],
                },
                {
                  name: "Latin-1 Supplement",
                  range: { start: "U+0080", end: "U+00FF" },
                  count: 128,
                  relatedScripts: ["Latin"],
                },
              ],
            },
          },
        },
      },
      description: "List of all Unicode blocks",
    },
    ...(generateReferences([
      429,
      500,
    ])),
  },
});

export function registerBlocksListRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_BLOCKS_LIST_ROUTE, async (c) => {
    const { version } = c.req.param();

    log.info("Fetching blocks list");

    // TODO: Fetch blocks list from Unicode database
    log.info("Blocks list request", { version });

    return internalServerError(c, {
      message: "Blocks list not yet available. API implementation pending.",
    });
  });
}

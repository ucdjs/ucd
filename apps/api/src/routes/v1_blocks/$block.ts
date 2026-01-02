import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { UnicodeBlockSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { z } from "zod";
import { MAX_AGE_ONE_DAY_SECONDS } from "../../constants";
import { badRequest, notFound } from "../../lib/errors";
import { createLogger } from "../../lib/logger";
import { VERSION_ROUTE_PARAM } from "../../lib/shared-parameters";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";

const log = createLogger("ucd:api:v1_blocks");

const GET_BLOCK_ROUTE = createRoute({
  method: "get",
  path: "/{version}/{block}",
  tags: [OPENAPI_TAGS.BLOCKS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_blocks:block",
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS}`,
    }),
  ],
  parameters: [
    VERSION_ROUTE_PARAM,
    {
      name: "block",
      in: "path",
      schema: { type: "string" },
      required: true,
      description: "Unicode block name or ID (e.g., Basic_Latin, CJK_Unified_Ideographs)",
    },
  ],

  description: dedent`
    ## Get Unicode Block Details

    Retrieve detailed information about a specific Unicode block.

    - Supports **block name or ID** (e.g., \`Basic_Latin\`, \`CJK_Unified_Ideographs\`)
    - Returns **block information** including codepoint range and character count
    - Optionally **includes character list** with minimal or detailed format
    - Supports **pagination** via limit parameter
    - Supports **caching** for performance optimization
  `,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeBlockSchema,
          examples: {
            default: {
              summary: "Basic Latin block",
              value: {
                name: "Basic Latin",
                aliases: ["ASCII"],
                range: { start: "U+0000", end: "U+007F" },
                count: 128,
                description: "ASCII characters and basic Latin",
                relatedScripts: ["Latin"],
              },
            },
            withCharacters: {
              summary: "Block with characters",
              value: {
                name: "Basic Latin",
                aliases: ["ASCII"],
                range: { start: "U+0000", end: "U+007F" },
                count: 128,
                description: "ASCII characters and basic Latin",
                relatedScripts: ["Latin"],
                characters: [
                  { codepoint: "U+0041", character: "A", name: "LATIN CAPITAL LETTER A" },
                  { codepoint: "U+0061", character: "a", name: "LATIN SMALL LETTER A" },
                ],
              },
            },
          },
        },
      },
      description: "Block details",
    },
    ...(generateReferences([
      400,
      404,
      429,
      500,
    ])),
  },
});

export function registerBlockRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_BLOCK_ROUTE, async (c) => {
    const { block, version } = c.req.param();

    if (!block || block.length === 0) {
      log.warn("Empty block name");
      return badRequest(c, {
        message: "Block name cannot be empty",
      });
    }

    // TODO: Fetch block data from Unicode database
    // Include characters if requested, apply format and limit
    log.info("Fetching block data", {
      block,
      version,
    });

    return notFound(c, {
      message: `Block "${block}" not found. API implementation pending.`,
    });
  });
}

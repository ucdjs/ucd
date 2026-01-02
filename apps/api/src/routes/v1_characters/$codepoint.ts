import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { UnicodeCharacterSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { z } from "zod";
import { MAX_AGE_ONE_DAY_SECONDS } from "../../constants";
import { badRequest, notFound } from "../../lib/errors";
import { createLogger } from "../../lib/logger";
import { VERSION_ROUTE_PARAM } from "../../lib/shared-parameters";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";

const log = createLogger("ucd:api:v1_characters");

const GET_CHARACTER_ROUTE = createRoute({
  method: "get",
  path: "/{version}/{codepoint}",
  tags: [OPENAPI_TAGS.CHARACTERS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_characters:codepoint",
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS}`,
    }),
  ],
  parameters: [
    VERSION_ROUTE_PARAM,
    {
      name: "codepoint",
      in: "path",
      schema: { type: "string" },
      required: true,
      description: "Unicode codepoint in U+XXXX, 0xXXXX, decimal, or character format (e.g., U+0041, 0x41, 65, A)",
    },
  ],
  description: dedent`
    ## Get Unicode Character Details

    Retrieve detailed information about a specific Unicode character by its codepoint.

    - Supports multiple **codepoint formats** (hexadecimal, decimal, character)
    - Returns **comprehensive character data** including name, category, block, script
    - Includes **case mappings** when applicable
    - Supports **caching** for performance optimization
  `,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeCharacterSchema,
          examples: {
            default: {
              summary: "Latin capital letter A",
              value: {
                codepoint: "U+0041",
                character: "A",
                name: "LATIN CAPITAL LETTER A",
                category: "Lu",
                bidiCategory: "L",
                block: "Basic Latin",
                script: "Latin",
                caseMapping: {
                  lowercase: "U+0061",
                },
              },
            },
          },
        },
      },
      description: "Character information",
    },
    ...(generateReferences([
      400,
      404,
      429,
      500,
    ])),
  },
});

/**
 * Parse codepoint in various formats to a standard U+XXXX format
 */
function parseCodepoint(input: string): string | null {
  // Already in U+XXXX format
  if (/^U\+[0-9A-Fa-f]{4,6}$/.test(input)) {
    return input.toUpperCase();
  }

  // 0xXXXX format
  if (/^0x[0-9A-Fa-f]{1,6}$/.test(input)) {
    const hex = input.slice(2);
    return `U+${hex.toUpperCase().padStart(4, "0")}`;
  }

  // Decimal format
  if (/^\d+$/.test(input)) {
    const num = Number.parseInt(input, 10);
    if (num < 0 || num > 0x10FFFF) {
      return null;
    }
    return `U+${num.toString(16).toUpperCase().padStart(4, "0")}`;
  }

  // Single character
  if (input.length === 1) {
    const code = input.charCodeAt(0);
    return `U+${code.toString(16).toUpperCase().padStart(4, "0")}`;
  }

  return null;
}

export function registerCharacterRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_CHARACTER_ROUTE, async (c) => {
    const { codepoint: codepointInput, version } = c.req.param();

    const codepoint = parseCodepoint(codepointInput);

    if (!codepoint) {
      log.warn("Invalid codepoint format", { input: codepointInput });
      return badRequest(c, {
        message: `Invalid codepoint format: "${codepointInput}". Use formats like U+0041, 0x41, 65, or A`,
      });
    }

    // TODO: Fetch character data from Unicode database
    // For now, return a placeholder response
    log.info("Fetching character data", { codepoint, version });

    return notFound(c, {
      message: `Character data for ${codepoint} not yet available. API implementation pending.`,
    });
  });
}

import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { UnicodePropertyResponseSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { MAX_AGE_ONE_DAY_SECONDS } from "../../constants";
import { badRequest, notFound } from "../../lib/errors";
import { createLogger } from "../../lib/logger";
import { VERSION_ROUTE_PARAM } from "../../lib/shared-parameters";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";

const log = createLogger("ucd:api:v1_properties");

const GET_PROPERTY_ROUTE = createRoute({
  method: "get",
  path: "/{version}/{property}",
  tags: [OPENAPI_TAGS.PROPERTIES],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_properties:property",
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS}`,
    }),
  ],
  parameters: [
    VERSION_ROUTE_PARAM,
    {
      name: "property",
      in: "path",
      schema: { type: "string" },
      required: true,
      description: "Unicode property name (e.g., Alphabetic, Uppercase, Emoji)",
    },
  ],
  description: dedent`
    ## Get Characters by Unicode Property

    Retrieve all characters that have a specific Unicode property.

    - Supports **multiple property names** (e.g., \`Alphabetic\`, \`Uppercase\`, \`Emoji\`)
    - Returns characters in **multiple formats** (JSON details, codepoint ranges, simple list)
    - Supports **property value filtering** (e.g., \`Numeric_Value=5\`)
    - Includes **pagination** via limit and offset
    - Supports **caching** for performance optimization
  `,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodePropertyResponseSchema,
          examples: {
            ranges: {
              summary: "Emoji characters in ranges format",
              value: {
                property: "Emoji",
                total: 1234,
                ranges: [
                  { start: "U+1F600", end: "U+1F64F", count: 80 },
                  { start: "U+1F300", end: "U+1F5FF", count: 512 },
                ],
              },
            },
            list: {
              summary: "Alphabetic characters in list format",
              value: {
                property: "Alphabetic",
                format: "list",
                total: 5000,
                characters: [
                  { codepoint: "U+0041", character: "A", name: "LATIN CAPITAL LETTER A" },
                  { codepoint: "U+0061", character: "a", name: "LATIN SMALL LETTER A" },
                ],
              },
            },
          },
        },
      },
      description: "Characters matching the property",
    },
    ...(generateReferences([
      400,
      404,
      429,
      500,
    ])),
  },
});

export function registerPropertyRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_PROPERTY_ROUTE, async (c) => {
    const { property, version } = c.req.param();

    if (!property || property.length === 0) {
      log.warn("Empty property name");
      return badRequest(c, {
        message: "Property name cannot be empty",
      });
    }

    // TODO: Fetch property data from Unicode database
    // Filter by property and value, apply format, pagination
    log.info("Fetching property data", {
      property,
      version,
    });

    return notFound(c, {
      message: `Property "${property}" data not yet available. API implementation pending.`,
    });
  });
}

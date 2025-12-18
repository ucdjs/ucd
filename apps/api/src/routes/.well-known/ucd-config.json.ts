import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { UCDWellKnownConfigSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { MAX_AGE_ONE_DAY_SECONDS, V1_FILES_ROUTER_BASE_PATH, V1_VERSIONS_ROUTER_BASE_PATH, WELL_KNOWN_ROUTER_BASE_PATH } from "../../constants";
import { OPENAPI_TAGS } from "../../openapi";

const UCD_CONFIG_ROUTE = createRoute({
  method: "get",
  operationId: "getUCDConfig",
  path: "/ucd-config.json",
  tags: [OPENAPI_TAGS.WELL_KNOWN],
  middleware: [
    cache({
      cacheName: "ucdjs:well-known:ucd-config",
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS * 4}`, // 4 days
    }),
  ],
  description: dedent`
    ## UCD Configuration

    This endpoint retrieves the UCD configuration, including available API endpoints for accessing Unicode data resources.

    > [!NOTE]
    > The configuration follows the [UCD.js Well-Known Configuration](https://ucdjs.dev/docs/usage/well-known) specification.

  `,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UCDWellKnownConfigSchema,
          examples: {
            default: {
              summary: "UCD Configuration",
              value: {
                version: "0.1",
                endpoints: {
                  files: V1_FILES_ROUTER_BASE_PATH,
                  manifest: `${WELL_KNOWN_ROUTER_BASE_PATH}/ucd-store.json`,
                  versions: V1_VERSIONS_ROUTER_BASE_PATH,
                },
              },
            },
          },
        },
      },
      description: "Retrieves the UCD configuration",
    },
  },
});

export function registerUcdConfigRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(UCD_CONFIG_ROUTE, (c) => {
    return c.json({
      version: "0.1",
      endpoints: {
        files: V1_FILES_ROUTER_BASE_PATH,
        manifest: `${WELL_KNOWN_ROUTER_BASE_PATH}/ucd-store.json`,
        versions: V1_VERSIONS_ROUTER_BASE_PATH,
      },
    });
  });
}

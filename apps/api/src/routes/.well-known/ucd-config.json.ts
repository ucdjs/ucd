import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { badGateway } from "@ucdjs-internal/worker-utils";
import { UCDWellKnownConfigSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import {
  MAX_AGE_ONE_DAY_SECONDS,
  V1_FILES_ROUTER_BASE_PATH,
  V1_VERSIONS_ROUTER_BASE_PATH,
  WELL_KNOWN_ROUTER_BASE_PATH,
} from "../../constants";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { getAllVersionsFromList } from "../v1_versions/utils";

const UCD_CONFIG_ROUTE = createRoute({
  method: "get",
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
                versions: ["17.0.0", "16.0.0", "15.1.0"],
              },
            },
          },
        },
      },
      description: "Retrieves the UCD configuration",
    },
    ...(generateReferences([
      502,
    ])),
  },
});

export function registerUcdConfigRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(UCD_CONFIG_ROUTE, async (c) => {
    // Fetch versions list to include in config
    const [versions, err] = await getAllVersionsFromList();
    if (err) {
      return badGateway(c, {
        message: "Failed to fetch Unicode versions from upstream service",
      });
    }

    // Extract just the version strings
    const versionStrings = versions?.map((v) => v.version) ?? [];

    return c.json({
      version: "0.1",
      endpoints: {
        files: V1_FILES_ROUTER_BASE_PATH,
        manifest: `${WELL_KNOWN_ROUTER_BASE_PATH}/ucd-store/{version}.json`,
        versions: V1_VERSIONS_ROUTER_BASE_PATH,
      },
      versions: versionStrings,
    }, 200);
  });
}

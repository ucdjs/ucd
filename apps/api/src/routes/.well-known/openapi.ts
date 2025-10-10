import { createRoute } from "@hono/zod-openapi";
import { UCDWellKnownConfigSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { V1_FILES_ROUTER_BASE_PATH, V1_VERSIONS_ROUTER_BASE_PATH } from "../../constants";
import { OPENAPI_TAGS } from "../../openapi";
import { UCD_CONFIG_ROUTE_DOCS } from "./docs";

export const UCD_CONFIG_ROUTE = createRoute({
  method: "get",
  path: "/ucd-config.json",
  tags: [OPENAPI_TAGS.WELL_KNOWN],
  middleware: [
    cache({
      cacheName: "ucdjs:well-known:ucd-config",
      cacheControl: "max-age=345600", // 4 days
    }),
  ] as const,
  description: UCD_CONFIG_ROUTE_DOCS,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UCDWellKnownConfigSchema,
          examples: {
            default: {
              summary: "UCD Configuration",
              value: {
                version: "1.0",
                endpoints: {
                  files: V1_FILES_ROUTER_BASE_PATH,
                  manifest: `${V1_FILES_ROUTER_BASE_PATH}/.ucd-store.json`,
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

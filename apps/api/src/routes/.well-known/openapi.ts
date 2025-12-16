import { createRoute } from "@hono/zod-openapi";
import { UCDStoreManifestSchema, UCDWellKnownConfigSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { MAX_AGE_ONE_DAY_SECONDS, MAX_AGE_ONE_WEEK_SECONDS, V1_FILES_ROUTER_BASE_PATH, V1_VERSIONS_ROUTER_BASE_PATH } from "../../constants";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { UCD_CONFIG_ROUTE_DOCS, UCD_STORE_ROUTE_DOCS } from "./docs";

export const UCD_CONFIG_ROUTE = createRoute({
  method: "get",
  path: "/ucd-config.json",
  tags: [OPENAPI_TAGS.WELL_KNOWN],
  middleware: [
    cache({
      cacheName: "ucdjs:well-known:ucd-config",
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS * 4}`, // 4 days
    }),
  ],
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
                version: "0.1",
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

export const UCD_STORE_ROUTE = createRoute({
  method: "get",
  path: "/ucd-store.json",
  tags: [OPENAPI_TAGS.WELL_KNOWN],
  middleware: [
    cache({
      cacheName: "ucdjs:well-known:ucd-store",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
    }),
  ],
  description: UCD_STORE_ROUTE_DOCS,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UCDStoreManifestSchema,
          examples: {
            "ucd-store": {
              summary: "UCD Store Manifest",
              value: {
                "15.1.0": {
                  expectedFiles: [
                    "15.1.0/ucd/UnicodeData.txt",
                    "15.1.0/ucd/PropList.txt",
                    "15.1.0/ucd/emoji/emoji-data.txt",
                  ],
                },
                "15.0.0": {
                  expectedFiles: [
                    "15.0.0/ucd/UnicodeData.txt",
                    "15.0.0/ucd/PropList.txt",
                  ],
                },
                "16.0.0": {
                  expectedFiles: [
                    "16.0.0/ucd/UnicodeData.txt",
                    "16.0.0/ucd/PropList.txt",
                    "16.0.0/ucd/emoji/emoji-data.txt",
                  ],
                },
                "17.0.0": {
                  expectedFiles: [
                    "17.0.0/ucd/UnicodeData.txt",
                    "17.0.0/ucd/PropList.txt",
                    "17.0.0/ucd/emoji/emoji-data.txt",
                  ],
                },
              },
            },
          },
        },
      },
      description: "The UCD Store manifest",
    },
    ...(generateReferences([
      429,
      500,
      502,
    ])),
  },
});

import { createRoute } from "@hono/zod-openapi";
import { cache } from "hono/cache";
import { VERSION_ROUTE_PARAM } from "../../lib/shared-parameters";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { GET_VERSION_FILE_TREE_ROUTE_DOCS, LIST_ALL_UNICODE_VERSIONS_ROUTE_DOCS } from "./docs";
import { UnicodeTreeSchema, UnicodeVersionListSchema } from "./schemas";

export const LIST_ALL_UNICODE_VERSIONS_ROUTE = createRoute({
  method: "get",
  path: "/",
  tags: [OPENAPI_TAGS.VERSIONS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_versions:list",
      cacheControl: "max-age=345600", // 4 days
    }),
  ] as const,
  description: LIST_ALL_UNICODE_VERSIONS_ROUTE_DOCS,
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

export const GET_VERSION_FILE_TREE_ROUTE = createRoute({
  method: "get",
  path: "/{version}/file-tree",
  tags: [OPENAPI_TAGS.VERSIONS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_versions:file-tree",
      cacheControl: "max-age=604800", // 1 week
    }),
  ] as const,
  parameters: [
    VERSION_ROUTE_PARAM,
  ],
  description: GET_VERSION_FILE_TREE_ROUTE_DOCS,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeTreeSchema,
          examples: {
            default: {
              summary: "File tree for a Unicode version",
              value: [
                {
                  type: "file",
                  name: "ArabicShaping.txt",
                  path: "/ArabicShaping.txt",
                  lastModified: 1724601900000,
                },
                {
                  type: "file",
                  name: "BidiBrackets.txt",
                  path: "/BidiBrackets.txt",
                  lastModified: 1724601900000,
                },
                {
                  type: "directory",
                  name: "emoji",
                  path: "/emoji",
                  lastModified: 1724669760000,
                  children: [
                    {
                      type: "file",
                      name: "ReadMe.txt",
                      path: "/ReadMe.txt",
                      lastModified: 1724601900000,
                    },
                    {
                      type: "file",
                      name: "emoji-data.txt",
                      path: "/emoji-data.txt",
                      lastModified: 1724601900000,
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      description: "Structured list of files for a Unicode version",
    },
    ...(generateReferences([
      400,
      429,
      500,
      502,
    ])),
  },
});

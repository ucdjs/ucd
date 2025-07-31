import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { WILDCARD_HEAD_ROUTE_DOCS, WILDCARD_PARAM_DOCS, WILDCARD_ROUTE_DOCS } from "./docs";
import { FileEntryListSchema, UCDStoreManifestSchema } from "./schemas";

const WILDCARD_PARAM = {
  in: "path",
  name: "wildcard",
  description: WILDCARD_PARAM_DOCS,
  required: true,
  schema: {
    type: "string",
    pattern: ".*",
  },
  examples: {
    "UnicodeData.txt": {
      summary: "UnicodeData.txt for Unicode 15.0.0",
      value: "15.0.0/ucd/UnicodeData.txt",
    },
    "emoji-data.txt": {
      summary: "Emoji data file",
      value: "15.1.0/ucd/emoji/emoji-data.txt",
    },
    "root": {
      summary: "Root path",
      value: "",
    },
    "list-version-dir": {
      summary: "Versioned path",
      value: "15.1.0",
    },
  },
} as const;

export const GET_UCD_STORE = createRoute({
  method: "get",
  path: "/.ucd-store.json",
  tags: [OPENAPI_TAGS.FILES],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_files:ucd-store",
      cacheControl: "max-age=604800", // 7 days
    }),
  ] as const,
  description: "Retrieve the UCD Store manifest",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UCDStoreManifestSchema,
          examples: {
            "ucd-store": {
              summary: "UCD Store Manifest",
              value: {
                "15.1.0": "/15.1.0",
                "16.0.0": "/16.0.0",
                "17.0.0": "/17.0.0",
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

export const WILDCARD_ROUTE = createRoute({
  method: "get",
  path: "/{wildcard}",
  tags: [OPENAPI_TAGS.FILES],
  parameters: [WILDCARD_PARAM],
  description: WILDCARD_ROUTE_DOCS,
  responses: {
    200: {
      description: "Response from Unicode.org",
      headers: {
        [UCD_FILE_STAT_TYPE_HEADER]: {
          description: "The type of the file or directory",
          schema: {
            type: "string",
            enum: ["file", "directory"],
          },
          required: true,
        },
      },
      content: {
        "application/json": {
          schema: FileEntryListSchema,
          examples: {
            default: {
              summary: "A directory with entries",
              value: [
                {
                  type: "file",
                  name: "ReadMe.txt",
                  path: "/ReadMe.txt",
                  lastModified: 1693213740000,
                },
                {
                  type: "directory",
                  name: "charts",
                  path: "/charts",
                  lastModified: 1697495340000,
                },
              ],
            },
          },
        },
        "application/xml": {
          schema: {
            type: "string",
          },
        },
        "text/plain": {
          schema: {
            type: "string",
          },
          examples: {
            "15.0.0/ucd/UnicodeData.txt": {
              summary: "UnicodeData.txt for Unicode 15.0.0",
              value: dedent`
                0000;<control>;Cc;0;BN;;;;;N;NULL;;;;
                0001;<control>;Cc;0;BN;;;;;N;START OF HEADING;;;;
                0002;<control>;Cc;0;BN;;;;;N;START OF TEXT;;;;
                0003;<control>;Cc;0;BN;;;;;N;END OF TEXT;;;;
                0004;<control>;Cc;0;BN;;;;;N;END OF TRANSMISSION;;;;
                0005;<control>;Cc;0;BN;;;;;N;ENQUIRY;;;;
                0006;<control>;Cc;0;BN;;;;;N;ACKNOWLEDGE;;;;
              `,
            },
            "15.1.0/ucd/emoji/emoji-data.txt": {
              summary: "Emoji data file for Unicode 15.1.0",
              value: dedent`
                265F          ; Emoji                # E11.0  [1] (♟️)       chess pawn
                2660          ; Emoji                # E0.6   [1] (♠️)       spade suit
                2663          ; Emoji                # E0.6   [1] (♣️)       club suit
                2665..2666    ; Emoji                # E0.6   [2] (♥️..♦️)    heart suit..diamond suit
              `,
            },
          },
        },
        "text/html": {
          schema: {
            type: "string",
          },
        },
        "application/octet-stream": {
          schema: {
            format: "binary",
          },
        },
      },
    },
    ...(generateReferences([
      400,
      404,
      500,
      502,
    ])),
  },
});

export const METADATA_WILDCARD_ROUTE = createRoute({
  method: "head",
  path: "/{wildcard}",
  tags: [OPENAPI_TAGS.FILES],
  parameters: [WILDCARD_PARAM],
  description: WILDCARD_HEAD_ROUTE_DOCS,
  responses: {
    200: {
      description: "Response from Unicode.org",
      headers: {
        [UCD_FILE_STAT_TYPE_HEADER]: {
          description: "The type of the file or directory",
          schema: {
            type: "string",
            enum: ["file", "directory"],
          },
          required: true,
        },
        "Content-Type": {
          description: "The content type of the file",
          schema: {
            type: "string",
          },
          required: true,
        },
      },
    },
  },
});

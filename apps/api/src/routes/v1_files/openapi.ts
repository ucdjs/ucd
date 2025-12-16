import { createRoute, z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { FileEntryListSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { MAX_AGE_ONE_WEEK_SECONDS } from "../../constants";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import {
  PATTERN_PARAM_DOCS,
  SEARCH_PATH_PARAM_DOCS,
  SEARCH_QUERY_PARAM_DOCS,
  SEARCH_ROUTE_DOCS,
  WILDCARD_HEAD_ROUTE_DOCS,
  WILDCARD_PARAM_DOCS,
  WILDCARD_ROUTE_DOCS,
} from "./docs";

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

const PATTERN_QUERY_PARAM = {
  in: "query",
  name: "pattern",
  description: PATTERN_PARAM_DOCS,
  required: false,
  schema: {
    type: "string",
  },
  examples: {
    "txt-files": {
      summary: "Match all .txt files",
      value: "*.txt",
    },
    "prefix-match": {
      summary: "Match files starting with 'Uni'",
      value: "Uni*",
    },
    "contains-match": {
      summary: "Match files containing 'Data'",
      value: "*Data*",
    },
    "multi-extension": {
      summary: "Match .txt or .xml files",
      value: "*.{txt,xml}",
    },
  },
} as const;

export const WILDCARD_ROUTE = createRoute({
  method: "get",
  path: "/{wildcard}",
  tags: [OPENAPI_TAGS.FILES],
  parameters: [WILDCARD_PARAM, PATTERN_QUERY_PARAM],
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
                  path: "ReadMe.txt",
                  lastModified: 1693213740000,
                },
                {
                  type: "directory",
                  name: "charts",
                  path: "charts",
                  lastModified: 1697495340000,
                },
              ],
            },
          },
        },
        "application/xml": {
          schema: z.string(),
        },
        "text/plain": {
          schema: z.string(),
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
          schema: z.string(),
        },
        "application/pdf": {
          schema: {
            format: "binary",
            type: "string",
          },
        },
        "application/octet-stream": {
          schema: {
            format: "binary",
            type: "string",
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
        "Last-Modified": {
          description: "Last modification time from upstream",
          schema: { type: "string" },
          required: false,
        },
        "Content-Length": {
          description: "Byte length when applicable",
          schema: { type: "string" },
          required: false,
        },
      },
    },
  },
});

export const SEARCH_ROUTE = createRoute({
  method: "get",
  path: "/search",
  tags: [OPENAPI_TAGS.FILES],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_files:search",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
    }),
  ],
  parameters: [
    {
      in: "query",
      name: "q",
      description: SEARCH_QUERY_PARAM_DOCS,
      required: true,
      schema: {
        type: "string",
        minLength: 1,
      },
      examples: {
        "unicode-prefix": {
          summary: "Search for entries starting with 'uni'",
          value: "uni",
        },
        "version-prefix": {
          summary: "Search for version directories",
          value: "15",
        },
      },
    },
    {
      in: "query",
      name: "path",
      description: SEARCH_PATH_PARAM_DOCS,
      required: false,
      schema: {
        type: "string",
      },
      examples: {
        "root": {
          summary: "Search from root",
          value: "",
        },
        "ucd-dir": {
          summary: "Search within UCD directory",
          value: "15.1.0/ucd",
        },
      },
    },
  ],
  description: SEARCH_ROUTE_DOCS,
  responses: {
    200: {
      description: "Search results sorted with files first, then directories",
      content: {
        "application/json": {
          schema: FileEntryListSchema,
          examples: {
            "files-first": {
              summary: "Files appear before directories",
              value: [
                {
                  type: "file",
                  name: "computer.txt",
                  path: "computer.txt",
                  lastModified: 1693213740000,
                },
                {
                  type: "directory",
                  name: "come",
                  path: "come",
                  lastModified: 1697495340000,
                },
              ],
            },
            "empty-results": {
              summary: "No matching entries",
              value: [],
            },
          },
        },
      },
    },
    ...(generateReferences([
      400,
      500,
      502,
    ])),
  },
});

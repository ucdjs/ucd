import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { generateReferences, OPENAPI_TAGS } from "../openapi";
import { ProxyMetadataSchema, ProxyResponseSchema } from "./v1_unicode-proxy.schemas";

const WILDCARD_PARAM = {
  in: "path",
  name: "wildcard",
  description: dedent`
    The path to the Unicode data resource you want to access. This can be any valid path from the official Unicode Public directory structure.

    ## Path Format Options

    | Pattern | Description | Example |
    |---------|-------------|---------|
    | \`{version}/ucd/{filename}\` | UCD files for specific version | \`15.1.0/ucd/UnicodeData.txt\` |
    | \`{version}/ucd/{sub}/{file}\` | Files in subdirectories | \`15.1.0/ucd/emoji/emoji-data.txt\` |
    | \`{version}\` | List files for version | \`15.1.0\` |
    | \`latest/ucd/{filename}\` | Latest version of file | \`latest/ucd/PropList.txt\` |
  `,
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

export const UNICODE_PROXY_WILDCARD_ROUTE = createRoute({
  method: "get",
  path: "/{wildcard}",
  tags: [OPENAPI_TAGS.PROXY],
  description: dedent`
    # Unicode Data Proxy Endpoint

    Access Unicode Character Database files and directories through a secure proxy with built-in caching and security measures.

    This endpoint provides **direct access** to official Unicode data files hosted at \`unicode.org\`. You can retrieve individual UCD files, browse directory listings, or access specific Unicode versions.

    **💡 Pro Tip:**<br/>
    If you only need file metadata (size, modification time), use the \`/__stat/{wildcard}\` endpoint instead. It's much faster since it doesn't download the full content.

    ## Use Cases

    - 📄 **Download Unicode data files** - UnicodeData.txt, PropList.txt, Scripts.txt, etc.
    - 😀 **Access emoji data** - emoji-data.txt, emoji-sequences.txt
    - 📁 **Browse directory structure** - List available files and subdirectories
    - 🔢 **Version-specific access** - Get data for specific Unicode versions

    ## Response Types

    | Content Type | Description | Example Files |
    |--------------|-------------|---------------|
    | \`application/json\` | Directory listings or structured data | Directory contents |
    | \`text/plain; charset=utf-8\` | Unicode data files | \`UnicodeData.txt\`, \`PropList.txt\` |
    | \`application/octet-stream\` | Binary files or unknown types | Compressed files |

    ## Caching

    - ⚡ **1-hour cache** for all responses
  `,
  parameters: [
    WILDCARD_PARAM,
  ],
  responses: {
    200: {
      description: dedent`
        Successfully retrieved Unicode data resource. Content type varies based on the requested resource:

        ### Response Content Types

        | Content Type | When Used | Description |
        |-------------|-----------|-------------|
        | \`application/json\` | Directory listings | Structured data showing files and subdirectories |
        | \`text/plain; charset=utf-8\` | Unicode data files | Raw text files like \`.txt\` files |
        | \`application/octet-stream\` | Binary/unknown files | Default for unrecognized content types |
      `,
      content: {
        "application/json": {
          schema: ProxyResponseSchema,
        },
        "application/octet-stream": {
          schema: {
            type: "string",
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

export const UNICODE_PROXY_STAT_WILDCARD_ROUTE = createRoute({
  method: "get",
  path: "/__stat/{wildcard}",
  tags: [OPENAPI_TAGS.PROXY],
  description: dedent`
    # Unicode Data Statistics Endpoint

    Get **metadata information** about Unicode data files and directories without downloading their content.

    This lightweight endpoint provides file/directory metadata including modification times, sizes, and types.
  `,
  parameters: [
    WILDCARD_PARAM,
  ],
  responses: {
    200: {
      description: dedent`
        Returns metadata about the requested Unicode data resource without downloading the full content.

        ### Response Format

        The response provides essential file/directory information in a lightweight JSON format:

        \`\`\`json
        {
          "type": "file",
          "mtime": "2023-09-15T10:30:00Z",
          "size": 1889024
        }
        \`\`\`
      `,
      content: {
        "application/json": {
          schema: ProxyMetadataSchema,
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

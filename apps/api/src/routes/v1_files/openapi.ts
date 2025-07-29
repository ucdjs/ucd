import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { FileEntrySchema, UCDStoreManifestSchema } from "./schemas";

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
  description: "Retrieve the UCD store listing all available Unicode versions.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UCDStoreManifestSchema,
        },
      },
      description: "Successfully retrieved the UCD store contents with all available Unicode versions.",
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
  description: dedent`
    # Unicode Data Proxy Endpoint

    Access Unicode Character Database files and directories through a secure proxy with built-in caching and security measures.

    This endpoint provides **direct access** to official Unicode data files hosted at \`unicode.org\`. You can retrieve individual UCD files, browse directory listings, or access specific Unicode versions.

    **💡 Pro Tip:**<br/>
    If you only need file metadata (size, modification time), use the \`HEAD\` as the request method instead. It's much faster since it doesn't download the full content.

    ## Use Cases

    - 📄 **Download Unicode data files** - UnicodeData.txt, PropList.txt, Scripts.txt, etc.
    - 😀 **Access emoji data** - emoji-data.txt, emoji-sequences.txt
    - 📁 **Browse directory structure** - List available files and subdirectories
    - 🔢 **Version-specific access** - Get data for specific Unicode versions

    ## Response Types

    | Content Type                  | Description                           | Example Files                         |
    | ----------------------------- | ------------------------------------- | ------------------------------------- |
    | \`application/json\`          | Directory listings or structured data | Directory contents                    |
    | \`text/plain; charset=utf-8\` | Unicode data files                    | \`UnicodeData.txt\`, \`PropList.txt\` |
    | \`application/octet-stream\`  | Binary files or unknown types         | Compressed files                      |

    ## Custom Response Headers

    This endpoint includes custom headers that provide additional metadata about the resource:

    | Header                           | Values               | Description                                           |
    | -------------------------------- | -------------------- | ----------------------------------------------------- |
    | \`${UCD_FILE_STAT_TYPE_HEADER}\` | \`file \\| directory\` | Indicates whether the resource is a file or directory |

    **📋 Note for HEAD Requests:**<br/>
    All custom headers are exposed via \`Access-Control-Expose-Headers\` and are accessible in HEAD requests for efficient metadata retrieval without downloading content.
  `,
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
          schema: FileEntrySchema,
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

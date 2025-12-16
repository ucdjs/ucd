import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute, z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { createGlobMatcher, isValidGlobPattern } from "@ucdjs-internal/shared";
import { DEFAULT_USER_AGENT, UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { FileEntryListSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { HTML_EXTENSIONS, MAX_AGE_ONE_WEEK_SECONDS } from "../../constants";
import { badGateway, badRequest, notFound } from "../../lib/errors";
import { parseUnicodeDirectory } from "../../lib/files";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { determineContentTypeFromExtension, isInvalidPath } from "./utils";

const WILDCARD_PARAM = {
  in: "path",
  name: "wildcard",
  description: dedent`
    The path to the Unicode data resource you want to access. This can be any valid path from the official Unicode Public directory structure.

    ## Path Format Options

    | Pattern                        | Description                    | Example                             |
    |--------------------------------|--------------------------------|-------------------------------------|
    | \`{version}/ucd/{filename}\`   | UCD files for specific version | \`15.1.0/ucd/UnicodeData.txt\`      |
    | \`{version}/ucd/{sub}/{file}\` | Files in subdirectories        | \`15.1.0/ucd/emoji/emoji-data.txt\` |
    | \`{version}\`                  | List files for version         | \`15.1.0\`                          |
    | \`latest/ucd/{filename}\`      | Latest version of file         | \`latest/ucd/PropList.txt\`         |
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

const PATTERN_QUERY_PARAM = {
  in: "query",
  name: "pattern",
  description: dedent`
    A glob pattern to filter directory listing results by filename. Only applies when the response is a directory listing.
    The matching is **case-insensitive**.

    ## Supported Glob Syntax

    | Pattern   | Description                                   | Example                                              |
    |-----------|-----------------------------------------------|------------------------------------------------------|
    | \`*\`     | Match any characters (except path separators) | \`*.txt\` matches \`file.txt\`                       |
    | \`?\`     | Match a single character                      | \`file?.txt\` matches \`file1.txt\`                  |
    | \`{a,b}\` | Match any of the patterns                     | \`*.{txt,xml}\` matches \`file.txt\` or \`file.xml\` |
    | \`[abc]\` | Match any character in the set                | \`file[123].txt\` matches \`file1.txt\`              |

    ## Examples

    - \`*.txt\` - Match all text files
    - \`Uni*\` - Match files starting with "Uni" (e.g., UnicodeData.txt)
    - \`*Data*\` - Match files containing "Data"
    - \`*.{txt,xml}\` - Match text or XML files
  `,
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
  description: dedent`
    This endpoint proxies your request directly to Unicode.org, allowing you to access any file or directory under the Unicode Public directory structure with only slight [modifications](#tag/files/get/api/v1/files/{wildcard}/description/modifications).

    > [!IMPORTANT]
    > The \`{wildcard}\` parameter can be any valid path, you are even allowed to use nested paths like \`15.1.0/ucd/emoji/emoji-data.txt\`.

    > [!NOTE]
    > If you wanna access only some metadata about the path, you can use a \`HEAD\` request instead. See [here](#tag/files/head/api/v1/files/{wildcard})


    ### Modifications

    We are doing a slight modification to the response, only if the response is for a directory.
    If you request a directory, we will return a JSON listing of the files and subdirectories in that directory.
  `,
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
  description: dedent`
    This endpoint returns metadata about the requested file or directory without fetching the entire content.
    It is useful for checking the existence of a file or directory and retrieving its metadata without downloading
    the content.

    > [!NOTE]
    > The \`HEAD\` request will return the same headers as a \`GET\` request, but without the body.
    > This means you can use it to check if a file exists or to get metadata like the last modified date, size, etc.
  `,
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

export function registerWildcardRoute(router: OpenAPIHono<HonoEnv>) {
  router.openAPIRegistry.registerPath(WILDCARD_ROUTE);
  router.openAPIRegistry.registerPath(METADATA_WILDCARD_ROUTE);

  router.get("/:wildcard{.*}?", cache({
    cacheName: "ucdjs:v1_files:files",
    cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
  }), async (c) => {
    const path = c.req.param("wildcard")?.trim() || "";

    // Validate path for path traversal attacks
    if (isInvalidPath(path)) {
      return badRequest({
        message: "Invalid path",
      });
    }

    const normalizedPath = path.replace(/^\/+|\/+$/g, "");
    const url = normalizedPath
      ? `https://unicode.org/Public/${normalizedPath}?F=2`
      : "https://unicode.org/Public?F=2";

    // eslint-disable-next-line no-console
    console.info(`[v1_files]: fetching file at ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return notFound(c, {
          message: "Resource not found",
        });
      }

      return badGateway(c);
    }

    let contentType = response.headers.get("content-type") || "";
    const lastModified = response.headers.get("Last-Modified") || undefined;
    const upstreamContentLength = response.headers.get("Content-Length") || undefined;
    const baseHeaders: Record<string, string> = {};
    if (lastModified) baseHeaders["Last-Modified"] = lastModified;

    const leaf = normalizedPath.split("/").pop() ?? "";
    const extName = leaf.includes(".") ? leaf.split(".").pop()!.toLowerCase() : "";
    const isHtmlFile = HTML_EXTENSIONS.includes(`.${extName}`);

    // check if this is a directory listing (HTML response for non-HTML files)
    const isDirectoryListing = contentType.includes("text/html") && !isHtmlFile;

    // eslint-disable-next-line no-console
    console.info(`[v1_files]: fetched content type: ${contentType} for .${extName} file`);
    if (isDirectoryListing) {
      const html = await response.text();
      let files = await parseUnicodeDirectory(html);

      // Apply pattern filter if provided
      const pattern = c.req.query("pattern");
      if (pattern) {
        // eslint-disable-next-line no-console
        console.info(`[v1_files]: applying glob pattern filter: ${pattern}`);
        if (!isValidGlobPattern(pattern, {
          maxLength: 128,
          maxSegments: 8,
          maxBraceExpansions: 8,
          maxStars: 16,
          maxQuestions: 16,
        })) {
          return badRequest({
            message: "Invalid glob pattern",
          });
        }

        const matcher = createGlobMatcher(pattern);
        files = files.filter((entry) => matcher(entry.name));
      }

      return c.json(files, 200, {
        ...baseHeaders,

        // Custom STAT Headers
        [UCD_FILE_STAT_TYPE_HEADER]: "directory",
      });
    }

    // eslint-disable-next-line no-console
    console.log(`[v1_files]: pre content type check: ${contentType} for .${extName} file`);
    contentType ||= determineContentTypeFromExtension(extName);
    // eslint-disable-next-line no-console
    console.log(`[v1_files]: inferred content type as ${contentType} for .${extName} file`);

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      ...baseHeaders,

      // Custom STAT Headers
      [UCD_FILE_STAT_TYPE_HEADER]: "file",
    };

    const cd = response.headers.get("Content-Disposition");
    if (cd) headers["Content-Disposition"] = cd;
    if (upstreamContentLength) headers["Content-Length"] = upstreamContentLength;
    return c.newResponse(response.body!, 200, headers);
  });
}

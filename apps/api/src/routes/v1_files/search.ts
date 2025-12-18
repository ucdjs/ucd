import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { DEFAULT_USER_AGENT } from "@ucdjs/env";
import { FileEntryListSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { MAX_AGE_ONE_WEEK_SECONDS } from "../../constants";
import { badGateway, badRequest } from "../../lib/errors";
import { parseUnicodeDirectory } from "../../lib/files";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { isInvalidPath } from "./utils";

const SEARCH_ROUTE_DOCS = dedent`
  Search for files and directories within a path. This endpoint performs a **prefix-based search** on entry names.

  ## Search Behavior

  The search is **case-insensitive** and matches entries where the name **starts with** the query string.

  Results are sorted with **files first**, followed by **directories**. This prioritization means:
  - If your query matches both files and directories, files appear first
  - Within each group (files/directories), results maintain their original order

  ## Example

  Given a directory with:
  - \`come/\` (directory)
  - \`computer.txt\` (file)

  | Query    | Result                                         |
  |----------|------------------------------------------------|
  | \`com\`  | \`computer.txt\` (file), \`come/\` (directory) |
  | \`come\` | \`come/\` (exact directory match)              |
  | \`comp\` | \`computer.txt\`                               |

  > [!NOTE]
  > If no entries match the query, an empty array is returned with a 200 status.
`;

const SEARCH_QUERY_PARAM_DOCS = dedent`
  The search query string. Entries are matched if their name **starts with** this value (case-insensitive).
`;

const SEARCH_PATH_PARAM_DOCS = dedent`
  The base path to search within. If not provided, searches from the root of the Unicode Public directory.
`;

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

export function registerSearchRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(SEARCH_ROUTE, async (c) => {
    const query = c.req.query("q");
    const basePath = c.req.query("path") || "";

    if (!query) {
      return badRequest({
        message: "Missing required query parameter: q",
      });
    }

    // Validate basePath for path traversal attacks
    if (isInvalidPath(basePath)) {
      return badRequest({
        message: "Invalid path",
      });
    }

    const normalizedPath = basePath.replace(/^\/+|\/+$/g, "");
    const url = normalizedPath
      ? `https://unicode.org/Public/${normalizedPath}?F=2`
      : "https://unicode.org/Public?F=2";

    // eslint-disable-next-line no-console
    console.info(`[v1_files:search]: fetching directory at ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array if the base path doesn't exist
        return c.json([], 200);
      }
      return badGateway(c);
    }

    const contentType = response.headers.get("content-type") || "";

    // If not a directory listing, return empty results
    if (!contentType.includes("text/html")) {
      return c.json([], 200);
    }

    const html = await response.text();
    const entries = await parseUnicodeDirectory(html);

    // Filter entries where name starts with query (case-insensitive)
    const queryLower = query.toLowerCase();
    const matchingEntries = entries.filter((entry) =>
      entry.name.toLowerCase().startsWith(queryLower),
    );

    // Sort: files first, then directories
    const sortedEntries = matchingEntries.toSorted((a, b) => {
      // Files before directories
      if (a.type === "file" && b.type === "directory") return -1;
      if (a.type === "directory" && b.type === "file") return 1;
      // Maintain original order within same type
      return 0;
    });

    return c.json(sortedEntries, 200);
  });
}

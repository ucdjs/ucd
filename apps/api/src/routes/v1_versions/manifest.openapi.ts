import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { MAX_AGE_ONE_WEEK_SECONDS } from "@ucdjs-internal/worker-utils";
import { UCDStoreVersionManifestSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { V1_VERSIONS_MANIFEST_CACHE_NAME } from "../../constants";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";

const VERSION_MANIFEST_PARAM = {
  name: "version",
  in: "path",
  required: true,
  description: "Unicode version (e.g., '16.0.0')",
  schema: {
    type: "string",
    pattern: "^\\d+\\.\\d+\\.\\d+$",
    example: "16.0.0",
  },
} as const;

export const GET_VERSION_MANIFEST_ROUTE = createRoute({
  method: "get",
  path: "/{version}/manifest",
  operationId: "getVersionManifest",
  "x-ucd-client-method": "versions.getManifest",
  tags: [OPENAPI_TAGS.VERSIONS],
  middleware: [
    cache({
      cacheName: V1_VERSIONS_MANIFEST_CACHE_NAME,
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`,
    }),
  ],
  parameters: [
    VERSION_MANIFEST_PARAM,
  ],
  description: dedent`
    ## Get Unicode Version Manifest

    This endpoint returns the canonical per-version manifest for the requested Unicode version.

    Each file entry includes:
    - \`name\`: The filename only
    - \`path\`: Path for the \`/api/v1/files\` endpoint
    - \`storePath\`: Path for the Store HTTP surface
  `,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UCDStoreVersionManifestSchema,
          examples: {
            default: {
              summary: "Manifest for version 16.0.0",
              value: {
                expectedFiles: [
                  {
                    name: "UnicodeData.txt",
                    path: "/16.0.0/ucd/UnicodeData.txt",
                    storePath: "/16.0.0/UnicodeData.txt",
                  },
                ],
              },
            },
          },
        },
      },
      description: "The manifest for the specified Unicode version",
    },
    ...(generateReferences([
      400,
      404,
      429,
      500,
      502,
    ])),
  },
});

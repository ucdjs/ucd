import type { OpenAPIHono } from "@hono/zod-openapi";
import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { HonoEnv } from "../../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { cache } from "hono/cache";
import { z } from "zod";
import { MAX_AGE_ONE_WEEK_SECONDS } from "../../../constants";
import { badGateway, notFound } from "../../../lib/errors";
import { generateReferences, OPENAPI_TAGS } from "../../../openapi";

const STORE_MANIFEST_PREFIX = "manifest/";

// Schema for single version manifest (just the value part of UCDStoreManifest)
const SingleVersionManifestSchema = z
  .object({
    /**
     * List of expected file paths for this version.
     * Defaults to an empty array when not provided.
     */
    expectedFiles: z.array(z.string()).default([]),
  })
  .default({
    expectedFiles: [],
  });

const VERSION_PARAM = {
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

const UCD_STORE_VERSION_ROUTE = createRoute({
  method: "get",
  path: "/ucd-store/{version}.json",
  tags: [OPENAPI_TAGS.WELL_KNOWN],
  middleware: [
    cache({
      cacheName: "ucdjs:well-known:ucd-store-version",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
    }),
  ],
  parameters: [VERSION_PARAM],
  description: dedent`
    ## UCD Store Manifest (Per Version)

    This endpoint retrieves the UCD Store manifest for a specific Unicode version, containing metadata about expected files for that version.

    This is the recommended endpoint for fetching manifest data, as it provides:
    - Smaller payloads (only the requested version)
    - Better caching (version-specific cache invalidation)
    - Reduced server load

    > [!NOTE]
    > The monolithic endpoint \`/.well-known/ucd-store.json\` is deprecated. Use this per-version endpoint instead.
  `,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SingleVersionManifestSchema,
          examples: {
            default: {
              summary: "UCD Store Manifest for version 16.0.0",
              value: {
                expectedFiles: [
                  "16.0.0/ucd/UnicodeData.txt",
                  "16.0.0/ucd/PropList.txt",
                  "16.0.0/ucd/emoji/emoji-data.txt",
                ],
              },
            },
          },
        },
      },
      description: "The UCD Store manifest for the specified version",
    },
    ...(generateReferences([
      404,
      429,
      500,
      502,
    ])),
  },
});

export function registerUcdStoreVersionRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(UCD_STORE_VERSION_ROUTE, async (c) => {
    const version = c.req.param("version");
    const bucket = c.env.UCD_BUCKET;

    if (!bucket) {
      console.error("[well-known]: UCD_BUCKET binding not configured");
      return badGateway(c);
    }

    if (!version) {
      return notFound(c, {
        message: "Version parameter is required",
      });
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      return notFound(c, {
        message: `Invalid version format: ${version}. Expected format: X.Y.Z (e.g., 16.0.0)`,
      });
    }

    // Fetch manifest.json for the specific version
    const key = `${STORE_MANIFEST_PREFIX}${version}/manifest.json`;
    const object = await bucket.get(key);

    if (!object) {
      return notFound(c, {
        message: `Manifest not found for version: ${version}`,
      });
    }

    try {
      const data = await object.json<UCDStoreManifest[typeof version]>();

      const headers: Record<string, string> = {
        "Cache-Control": "public, max-age=604800", // 7 days
      };

      if (object.uploaded) {
        headers["Last-Modified"] = object.uploaded.toUTCString();
      }

      return c.json(data, 200, headers);
    } catch (error) {
      console.error(`[well-known]: failed to parse manifest for version ${version}:`, error);
      return badGateway(c, {
        message: `Failed to parse manifest for version: ${version}`,
      });
    }
  });
}

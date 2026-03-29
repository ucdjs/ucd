import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoEnv } from "../../../types";
import {
  createVersionManifestHeaders,
  readVersionManifestData,
  readVersionManifestObject,
} from "#lib/version-manifest";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { isValidUnicodeVersion } from "@ucdjs-internal/shared";
import { badGateway, MAX_AGE_ONE_WEEK_SECONDS, notFound } from "@ucdjs-internal/worker-utils";
import { UCDStoreVersionManifestSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../../../openapi";

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
  parameters: [VERSION_PARAM],
  description: dedent`
    ## UCD Store Manifest (Per Version)

    This endpoint is a deprecated compatibility alias for the canonical version manifest route:

    - \`/api/v1/versions/{version}/manifest\`

    It returns the same manifest payload for backward compatibility.

    Each file entry includes:
    - \`name\`: The filename only
    - \`path\`: Path for the /api/v1/files endpoint (includes /ucd/ for versions >= 4.1.0)
    - \`storePath\`: Path for the store subdomain (ucd-store.ucdjs.dev)

    > [!NOTE]
    > This route is deprecated. Prefer \`/api/v1/versions/{version}/manifest\`.
  `,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UCDStoreVersionManifestSchema,
          examples: {
            default: {
              summary: "UCD Store Manifest for version 16.0.0",
              value: {
                expectedFiles: [
                  {
                    name: "UnicodeData.txt",
                    path: "/16.0.0/ucd/UnicodeData.txt",
                    storePath: "/16.0.0/UnicodeData.txt",
                  },
                  {
                    name: "PropList.txt",
                    path: "/16.0.0/ucd/PropList.txt",
                    storePath: "/16.0.0/PropList.txt",
                  },
                  {
                    name: "emoji-data.txt",
                    path: "/16.0.0/ucd/emoji/emoji-data.txt",
                    storePath: "/16.0.0/emoji/emoji-data.txt",
                  },
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
  router.openAPIRegistry.registerPath({
    ...UCD_STORE_VERSION_ROUTE,
    deprecated: true,
  });

  // TODO(luxass): Remove this compatibility alias once clients stop calling
  // `/.well-known/ucd-store/{version}.json` and the deprecation window ends.
  // We register the route separately to avoid, having weird behavior with the OpenAPI schema.
  router.get("/ucd-store/:version{.*\\.json}", cache({
    cacheName: "ucdjs:well-known:ucd-store-version",
    cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
  }), async (c) => {
    // We need to remove the .json extension from the version parameter.
    const version = c.req.param("version").replace(".json", "");
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

    // Validate version
    if (!isValidUnicodeVersion(version)) {
      return notFound(c, {
        message: `Invalid version format: ${version}. Expected format: X.Y.Z (e.g., 16.0.0)`,
      });
    }

    const object = await readVersionManifestObject(bucket, version);

    if (!object) {
      return notFound(c, {
        message: `Manifest not found for version: ${version}`,
      });
    }

    try {
      const { data, manifestText } = await readVersionManifestData(object);
      const headers = await createVersionManifestHeaders(bucket, version, object, manifestText);
      return c.json(data, 200, headers);
    } catch (err) {
      console.error(`[well-known]: failed to parse manifest for version ${version}:`, err);
      return badGateway(c, {
        message: `Failed to parse manifest for version: ${version}`,
      });
    }
  });
}

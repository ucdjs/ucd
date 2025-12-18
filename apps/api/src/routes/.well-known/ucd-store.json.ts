import type { OpenAPIHono } from "@hono/zod-openapi";
import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { HonoEnv } from "../../types";
import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { UCDStoreManifestSchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { MAX_AGE_ONE_WEEK_SECONDS } from "../../constants";
import { badGateway } from "../../lib/errors";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";

const STORE_MANIFEST_PREFIX = "manifest/";

const UCD_STORE_ROUTE = createRoute({
  method: "get",
  path: "/ucd-store.json",
  tags: [OPENAPI_TAGS.WELL_KNOWN],
  middleware: [
    cache({
      cacheName: "ucdjs:well-known:ucd-store",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
    }),
  ],
  description: dedent`
    ## UCD Store Manifest

    This endpoint retrieves the UCD Store manifest, which contains metadata about available Unicode data files for each version.

    The manifest provides information about expected files for each Unicode version, allowing clients to discover and verify available data files.
  `,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UCDStoreManifestSchema,
          examples: {
            "ucd-store": {
              summary: "UCD Store Manifest",
              value: {
                "15.1.0": {
                  expectedFiles: [
                    "15.1.0/ucd/UnicodeData.txt",
                    "15.1.0/ucd/PropList.txt",
                    "15.1.0/ucd/emoji/emoji-data.txt",
                  ],
                },
                "15.0.0": {
                  expectedFiles: [
                    "15.0.0/ucd/UnicodeData.txt",
                    "15.0.0/ucd/PropList.txt",
                  ],
                },
                "16.0.0": {
                  expectedFiles: [
                    "16.0.0/ucd/UnicodeData.txt",
                    "16.0.0/ucd/PropList.txt",
                    "16.0.0/ucd/emoji/emoji-data.txt",
                  ],
                },
                "17.0.0": {
                  expectedFiles: [
                    "17.0.0/ucd/UnicodeData.txt",
                    "17.0.0/ucd/PropList.txt",
                    "17.0.0/ucd/emoji/emoji-data.txt",
                  ],
                },
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

export function registerUcdStoreRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(UCD_STORE_ROUTE, async (c) => {
    const bucket = c.env.UCD_BUCKET;
    if (!bucket) {
      console.error("[well-known]: UCD_BUCKET binding not configured");
      return badGateway(c);
    }

    // List all version directories under the manifest prefix
    const listResult = await bucket.list({ prefix: STORE_MANIFEST_PREFIX });

    if (!listResult.objects.length) {
      console.error("[well-known]: no manifest versions found in bucket");
      return c.json({} satisfies UCDStoreManifest, 200);
    }

    // Extract unique version directories from the object keys
    // Keys look like: manifest/17.0.0/manifest.json
    const versions = new Set<string>();
    for (const obj of listResult.objects) {
      const relativePath = obj.key.slice(STORE_MANIFEST_PREFIX.length);
      const version = relativePath.split("/")[0];
      if (version) {
        versions.add(version);
      }
    }

    // Fetch manifest.json for each version
    const manifest: UCDStoreManifest = {};
    let latestUploaded: Date | undefined;

    await Promise.all(
      Array.from(versions).map(async (version) => {
        const key = `${STORE_MANIFEST_PREFIX}${version}/manifest.json`;
        const object = await bucket.get(key);

        if (!object) {
          return;
        }

        try {
          const data = await object.json<UCDStoreManifest[typeof version]>();
          manifest[version] = data;

          // Track the latest upload time for Last-Modified header
          if (!latestUploaded || object.uploaded > latestUploaded) {
            latestUploaded = object.uploaded;
          }
        } catch (error) {
          console.error(`[well-known]: failed to parse manifest for version ${version}:`, error);
        }
      }),
    );

    const headers: Record<string, string> = {
      "Cache-Control": "public, max-age=3600", // 1 hour cache
    };

    if (latestUploaded) {
      headers["Last-Modified"] = latestUploaded.toUTCString();
    }

    return c.json(manifest, 200, headers);
  });
}

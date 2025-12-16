import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import {
  V1_FILES_ROUTER_BASE_PATH,
  V1_VERSIONS_ROUTER_BASE_PATH,
  WELL_KNOWN_ROUTER_BASE_PATH,
} from "../../constants";
import { badGateway } from "../../lib/errors";
import { UCD_CONFIG_ROUTE, UCD_STORE_ROUTE } from "./openapi";

const STORE_MANIFEST_PREFIX = "manifest/";

export const WELL_KNOWN_ROUTER = new OpenAPIHono<HonoEnv>().basePath(WELL_KNOWN_ROUTER_BASE_PATH);

WELL_KNOWN_ROUTER.openapi(UCD_CONFIG_ROUTE, (c) => {
  return c.json({
    version: "0.1",
    endpoints: {
      files: V1_FILES_ROUTER_BASE_PATH,
      manifest: `${WELL_KNOWN_ROUTER_BASE_PATH}/ucd-store.json`,
      versions: V1_VERSIONS_ROUTER_BASE_PATH,
    },
  });
});

WELL_KNOWN_ROUTER.openapi(UCD_STORE_ROUTE, async (c) => {
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

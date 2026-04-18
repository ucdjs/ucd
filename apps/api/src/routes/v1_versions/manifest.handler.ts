import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import {
  createVersionManifestHeaders,
  readVersionManifestData,
  readVersionManifestObject,
} from "#lib/version-manifest";
import { isValidUnicodeVersion } from "@ucdjs-internal/shared";
import { badGateway, badRequest, notFound } from "@ucdjs-internal/worker-utils";
import { GET_VERSION_MANIFEST_ROUTE } from "./manifest.openapi";

export function registerVersionManifestRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_VERSION_MANIFEST_ROUTE, async (c) => {
    const version = c.req.param("version");
    const bucket = c.env.UCD_BUCKET;

    if (!bucket) {
      console.error("[v1_versions]: UCD_BUCKET binding not configured");
      return badGateway(c);
    }

    if (!isValidUnicodeVersion(version)) {
      return badRequest(c, {
        message: "Invalid Unicode version",
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
      console.error(`[v1_versions]: failed to parse manifest for version ${version}:`, err);
      return badGateway(c, {
        message: `Failed to parse manifest for version: ${version}`,
      });
    }
  });
}

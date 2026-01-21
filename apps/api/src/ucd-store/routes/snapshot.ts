import type { HonoEnv } from "../../types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Snapshot } from "@ucdjs/schemas";
import { badGateway, notFound } from "../../lib/errors";
import { extractFilename } from "../lib/path-utils";

// Placeholder hash (sha256 with 64 zeros)
const PLACEHOLDER_HASH = "sha256:0000000000000000000000000000000000000000000000000000000000000000";

interface ManifestData {
  expectedFiles: string[];
}

export function registerSnapshotRoute(router: OpenAPIHono<HonoEnv>) {
  router.get("/:version/snapshot.json", async (c) => {
    const version = c.req.param("version");
    const bucket = c.env.UCD_BUCKET;

    if (!bucket) {
      console.error("[ucd-store]: UCD_BUCKET binding not configured");
      return badGateway(c);
    }

    try {
      // Fetch manifest from R2
      const manifestKey = `manifest/${version}/manifest.json`;
      const manifestObj = await bucket.get(manifestKey);

      if (!manifestObj) {
        return notFound(c, {
          message: `Manifest not found for version ${version}`,
        });
      }

      const manifestData = await manifestObj.json() as ManifestData;

      // Transform expectedFiles array into snapshot.files object
      const files: Snapshot["files"] = {};

      for (const filePath of manifestData.expectedFiles || []) {
        const filename = extractFilename(filePath, version);

        files[filename] = {
          hash: PLACEHOLDER_HASH,
          fileHash: PLACEHOLDER_HASH,
          size: 0, // Placeholder
        };
      }

      const snapshot: Snapshot = {
        unicodeVersion: version,
        files,
      };

      return c.json(snapshot, 200, {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400", // 24 hours
      });
    } catch (error) {
      console.error(`[ucd-store]: Failed to generate snapshot for ${version}:`, error);
      return badGateway(c);
    }
  });
}

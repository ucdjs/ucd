import type { Snapshot } from "@ucdjs/schemas";
import type { H3 } from "h3";
import { badGateway, badRequest, notFound } from "@ucdjs-internal/worker-utils";
import { getCloudflareEnv } from "@ucdjs-internal/worker-utils/h3";
import { extractFilename } from "../lib/path-utils";

// Placeholder hash (sha256 with 64 zeros)
const PLACEHOLDER_HASH = "sha256:0000000000000000000000000000000000000000000000000000000000000000";

interface ManifestData {
  expectedFiles: string[];
}

export function registerSnapshotRoute(app: H3) {
  app.get("/:version/snapshot.json", async (event) => {
    const env = getCloudflareEnv<Env>(event);
    const version = event.context.params?.version;
    const bucket = env.UCD_BUCKET;

    if (!version) {
      return badRequest({
        message: "Version parameter is required",
      });
    }

    if (!bucket) {
      console.error("[ucd-store]: UCD_BUCKET binding not configured");
      return badGateway();
    }

    try {
      // Fetch manifest from R2
      const manifestKey = `manifest/${version}/manifest.json`;
      const manifestObj = await bucket.get(manifestKey);

      if (!manifestObj) {
        return notFound({
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

      return Response.json(snapshot, {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=86400", // 24 hours
        },
      });
    } catch (err) {
      console.error(`[ucd-store]: Failed to generate snapshot for ${version}:`, err);
      return badGateway();
    }
  });
}

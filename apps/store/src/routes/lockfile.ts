import type { Lockfile } from "@ucdjs/schemas";
import type { H3 } from "h3";
import { badGateway } from "@ucdjs-internal/worker-utils";
import { getCloudflareEnv } from "@ucdjs-internal/worker-utils/h3";

const MANIFEST_KEY_RE = /^manifest\/([^/]+)\/manifest\.json$/;

interface ManifestData {
  expectedFiles: string[];
}

export function registerLockfileRoute(app: H3) {
  app.get("/.ucd-store.lock", async (event) => {
    const env = getCloudflareEnv<Env>(event);
    const bucket = env.UCD_BUCKET;

    if (!bucket) {
      console.error("[ucd-store]: UCD_BUCKET binding not configured");
      return badGateway();
    }

    try {
      // List all manifests in R2
      const listed = await bucket.list({ prefix: "manifest/" });

      // Build versions map
      const versions: Lockfile["versions"] = {};
      const now = new Date();

      for (const obj of listed.objects) {
        // Extract version from path: manifest/{version}/manifest.json
        const match = obj.key.match(MANIFEST_KEY_RE);
        if (!match) continue;

        const version = match[1]!;

        // Fetch manifest to get file count
        const manifestObj = await bucket.get(obj.key);
        if (!manifestObj) continue;

        const manifestData = await manifestObj.json() as ManifestData;
        const fileCount = manifestData.expectedFiles?.length || 0;

        versions[version] = {
          path: `${version}/snapshot.json`,
          fileCount,
          totalSize: 0, // Placeholder - manifest doesn't track sizes
          createdAt: obj.uploaded || now,
          updatedAt: obj.uploaded || now,
        };
      }

      const lockfile: Lockfile = {
        lockfileVersion: 1,
        createdAt: now,
        updatedAt: now,
        versions,
        filters: undefined,
      };

      return Response.json(lockfile, {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=3600", // 1 hour cache
        },
      });
    } catch (err) {
      console.error("[ucd-store]: Failed to generate lockfile:", err);
      return badGateway();
    }
  });
}

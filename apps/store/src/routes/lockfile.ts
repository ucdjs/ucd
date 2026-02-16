import type { Lockfile } from "@ucdjs/schemas";
import type { Hono } from "hono";
import type { HonoEnv } from "../types";
import { badGateway } from "@ucdjs-internal/worker-utils";

interface ManifestData {
  expectedFiles: string[];
}

export function registerLockfileRoute(router: Hono<HonoEnv>) {
  router.get("/.ucd-store.lock", async (c) => {
    const bucket = c.env.UCD_BUCKET;

    if (!bucket) {
      console.error("[ucd-store]: UCD_BUCKET binding not configured");
      return badGateway(c);
    }

    try {
      // List all manifests in R2
      const listed = await bucket.list({ prefix: "manifest/" });

      // Build versions map
      const versions: Lockfile["versions"] = {};
      const now = new Date();

      for (const obj of listed.objects) {
        // Extract version from path: manifest/{version}/manifest.json
        const match = obj.key.match(/^manifest\/([^/]+)\/manifest\.json$/);
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

      return c.json(lockfile, 200, {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // 1 hour cache
      });
    } catch (error) {
      console.error("[ucd-store]: Failed to generate lockfile:", error);
      return badGateway(c);
    }
  });
}

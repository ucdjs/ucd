import type { Lockfile } from "@ucdjs/schemas";
import type { H3 } from "h3";
import { badGateway } from "@ucdjs-internal/worker-utils";
import { getCloudflareEnv } from "@ucdjs-internal/worker-utils/h3";
import { SnapshotSchema } from "@ucdjs/schemas";

const SNAPSHOT_KEY_RE = /^manifest\/([^/]+)\/snapshot\.json$/;

export function registerLockfileRoute(app: H3) {
  app.get("/.ucd-store.lock", async (event) => {
    const env = getCloudflareEnv<Env>(event);
    const bucket = env.UCD_BUCKET;

    if (!bucket) {
      console.error("[ucd-store]: UCD_BUCKET binding not configured");
      return badGateway();
    }

    try {
      // List all stored manifest artifacts in R2 and derive the lockfile
      // from the per-version snapshot files.
      const listed = await bucket.list({ prefix: "manifest/" });

      // Build versions map
      const versions: Lockfile["versions"] = {};
      const now = new Date();

      for (const obj of listed.objects) {
        const match = obj.key.match(SNAPSHOT_KEY_RE);
        if (!match) continue;

        const version = match[1]!;

        const snapshotObj = await bucket.get(obj.key);
        if (!snapshotObj) continue;

        const parsed = SnapshotSchema.safeParse(await snapshotObj.json());
        if (!parsed.success) {
          console.error(`[ucd-store]: Invalid snapshot for ${version}:`, parsed.error);
          continue;
        }

        const fileEntries = Object.values(parsed.data.files);
        const fileCount = fileEntries.length;
        const totalSize = fileEntries.reduce((sum, file) => sum + file.size, 0);

        versions[version] = {
          path: `${version}/snapshot.json`,
          fileCount,
          totalSize,
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

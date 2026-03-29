import type { H3 } from "h3";
import { badGateway, badRequest, notFound } from "@ucdjs-internal/worker-utils";
import { getCloudflareEnv } from "@ucdjs-internal/worker-utils/h3";
import { SnapshotSchema } from "@ucdjs/schemas";

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
      const snapshotKey = `manifest/${version}/snapshot.json`;
      const snapshotObj = await bucket.get(snapshotKey);

      if (!snapshotObj) {
        return notFound({
          message: `Snapshot not found for version ${version}`,
        });
      }

      const parsed = SnapshotSchema.safeParse(await snapshotObj.json());
      if (!parsed.success) {
        console.error(`[ucd-store]: Invalid snapshot for ${version}:`, parsed.error);
        return badGateway();
      }

      return Response.json(parsed.data, {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=86400", // 24 hours
        },
      });
    } catch (err) {
      console.error(`[ucd-store]: Failed to load snapshot for ${version}:`, err);
      return badGateway();
    }
  });
}

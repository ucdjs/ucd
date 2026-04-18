import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { createDatabase } from "#db";
import { versions } from "#db/schema";
import { isValidUnicodeVersion } from "@ucdjs-internal/shared";
import { badRequest, notFound } from "@ucdjs-internal/worker-utils";
import { UNICODE_STABLE_VERSION } from "@unicode-utils/core";
import { eq } from "drizzle-orm";
import { GET_VERSION_ROUTE } from "./detail.openapi";
import { calculateStatistics } from "./utils";

export function registerGetVersionRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_VERSION_ROUTE, async (c) => {
    let version = c.req.param("version");

    if (version === "latest") {
      version = UNICODE_STABLE_VERSION;
    }

    if (!isValidUnicodeVersion(version)) {
      return badRequest(c, {
        message: "Invalid Unicode version",
      });
    }

    const db = createDatabase(c.env.UCD_DATA);
    const [row] = await db
      .select({
        version: versions.version,
        documentationUrl: versions.documentationUrl,
        date: versions.date,
        url: versions.url,
        mappedUcdVersion: versions.mappedUcdVersion,
        type: versions.status,
      })
      .from(versions)
      .where(eq(versions.version, version))
      .limit(1);

    if (!row) {
      return notFound(c, {
        message: "Unicode version not found",
      });
    }

    const bucket = c.env.UCD_BUCKET;
    let statistics = {
      newBlocks: 0,
      newCharacters: 0,
      newScripts: 0,
      totalBlocks: 0,
      totalCharacters: 0,
      totalScripts: 0,
    };

    if (bucket) {
      const tmp = await calculateStatistics(bucket, version);
      if (tmp) {
        statistics = tmp;
      }
    }

    return c.json({
      ...row,
      statistics,
    }, 200);
  });
}

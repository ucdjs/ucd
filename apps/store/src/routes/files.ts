import type { Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import type { HonoEnv } from "../types";
import {
  MAX_AGE_ONE_WEEK_SECONDS,
} from "@ucdjs-internal/worker-utils";
import { cache } from "hono/cache";

export function registerFilesRoute(router: Hono<HonoEnv>) {
  router.get(
    "/:version/:filepath{.*}?",
    cache({
      cacheName: "ucdjs:ucd-store:files",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
    }),
    async (c) => {
      const version = c.req.param("version");
      const filepath = c.req.param("filepath")?.trim() || "";

      if (!("files" in c.env.UCDJS_API)) {
        return c.json({ error: "Files API not available" }, 503);
      }

      const { body, headers, status } = await c.env.UCDJS_API.files(`${version}/ucd/${filepath}`, {
        query: c.req.query("query"),
        pattern: c.req.query("pattern"),
        type: c.req.query("type"),
        sort: c.req.query("sort"),
        order: c.req.query("order"),
        isHeadRequest: c.req.method === "HEAD",
        stripUCDPrefix: true,
      });

      return c.newResponse(body, status as StatusCode, headers);
    },
  );
}

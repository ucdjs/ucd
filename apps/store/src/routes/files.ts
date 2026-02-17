import type { Hono } from "hono";
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

      // @ts-ignore - TypeScript doesn't narrow the union type correctly here
      const result = await c.env.UCDJS_API.files(`${version}/ucd/${filepath}`, {
        query: c.req.query("query"),
        pattern: c.req.query("pattern"),
        type: c.req.query("type"),
        sort: c.req.query("sort"),
        order: c.req.query("order"),
        isHeadRequest: c.req.method === "HEAD",
        stripUCDPrefix: true,
      });

      return c.newResponse(result.body, result.status, result.headers);
    },
  );
}

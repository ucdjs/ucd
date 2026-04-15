import type { HonoEnv } from "#types";
import {
  badGateway,
  badRequest,
  clearCacheEntry,
} from "@ucdjs-internal/worker-utils";
import { Hono } from "hono";

export const TASK_PURGE_CACHE_ROUTER = new Hono<HonoEnv>();

TASK_PURGE_CACHE_ROUTER.get("/purge-cache", async (c) => {
  const cacheName = c.req.query("cacheName");
  const path = c.req.query("path");

  if (!cacheName) {
    return badRequest(c, { message: "Missing 'cacheName' query parameter" });
  }

  if (!path) {
    return badRequest(c, { message: "Missing 'path' query parameter" });
  }

  if (!path.startsWith("/")) {
    return badRequest(c, { message: "Path must start with /" });
  }

  try {
    const clearCache = await clearCacheEntry(cacheName);
    const url = new URL(c.req.url);
    const cacheUrl = `${url.origin}${path}`;
    await clearCache(cacheUrl);
    // eslint-disable-next-line no-console
    console.log(`[tasks]: purged cache for ${cacheUrl}`);

    return c.json({
      success: true,
      cacheName,
      purgedUrl: cacheUrl,
    }, 200);
  } catch (err) {
    console.error("[tasks]: failed to purge cache:", err);
    return badGateway(c);
  }
});

import type { HonoEnv } from "#types";
import { badGateway, unauthorized } from "@ucdjs-internal/worker-utils";
import { Hono } from "hono";
import { TASK_PURGE_CACHE_ROUTER } from "./purge-cache";
import { TASK_REINDEX_ROUTER } from "./reindex";
import { TASK_UPLOAD_ROUTER } from "./upload";

export const TASKS_ROUTER = new Hono<HonoEnv>().basePath("/_tasks");

TASKS_ROUTER.use("/*", async (c, next) => {
  // Skip auth for local development - safe since it's only localhost:8787
  if (c.env.ENVIRONMENT === "local") {
    return next();
  }

  // eslint-disable-next-line no-console
  console.log(`[tasks]: Authenticating request to ${c.req.url}`);
  const apiKey = c.req.header("X-UCDJS-Task-Key")?.trim();
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.log("[tasks]: Missing X-UCDJS-Task-Key header");
    return unauthorized(c, { message: "Missing task key" });
  }

  // eslint-disable-next-line no-console
  console.log(`[tasks]: Received API key: ${apiKey.length === 0 ? "(empty)" : "(redacted)"} (length: ${apiKey.length})`);
  const expectedKey = await c.env.UCDJS_TASK_API_KEY.get();

  if (!expectedKey) {
    console.error("[tasks]: UCDJS_TASK_API_KEY not configured");
    return badGateway(c);
  }

  if (apiKey !== expectedKey) {
    return unauthorized(c, { message: "Invalid or missing task key" });
  }

  await next();
});
TASKS_ROUTER.route("/", TASK_REINDEX_ROUTER);
TASKS_ROUTER.route("/", TASK_PURGE_CACHE_ROUTER);
TASKS_ROUTER.route("/", TASK_UPLOAD_ROUTER);

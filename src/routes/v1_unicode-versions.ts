import type { HonoEnv } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { FIRST_ROUTE } from "./v1_unicode-versions.openapi";

export const V1_UNICODE_VERSIONS_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/unicode-versions");

V1_UNICODE_VERSIONS_ROUTER.openapi(FIRST_ROUTE, async (c) => {
  return c.json({
    name: "UCD.js API",
  }, 200);
});

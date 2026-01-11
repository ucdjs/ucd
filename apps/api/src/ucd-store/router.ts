import type { HonoEnv } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerFilesRoute } from "./routes/files";
import { registerLockfileRoute } from "./routes/lockfile";
import { registerSnapshotRoute } from "./routes/snapshot";

export const UCD_STORE_ROUTER = new OpenAPIHono<HonoEnv>();

// Register all routes
registerLockfileRoute(UCD_STORE_ROUTER);
registerSnapshotRoute(UCD_STORE_ROUTER);
registerFilesRoute(UCD_STORE_ROUTER);

// Root route - simple API info
UCD_STORE_ROUTER.get("/", (c) => {
  return c.json({
    name: "UCD Store API",
    description: "Filesystem-style interface for Unicode Character Database files",
    version: "1.0.0",
    endpoints: {
      lockfile: "GET /.ucd-store.lock",
      snapshot: "GET /{version}/snapshot.json",
      files: "GET /{version}/{filepath}",
    },
    documentation: "https://ucdjs.dev/docs",
  });
});

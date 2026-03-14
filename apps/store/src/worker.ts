import type { HonoEnv } from "./types";
import {
  errorHandler,
  notFoundHandler,
} from "@ucdjs-internal/worker-utils";
import { setupCors, setupRatelimit } from "@ucdjs-internal/worker-utils/setups";
import { Hono } from "hono";
import { registerFilesRoute } from "./routes/files";
import { registerLockfileRoute } from "./routes/lockfile";
import { registerSnapshotRoute } from "./routes/snapshot";

const app = new Hono<HonoEnv>();

setupCors(app);
setupRatelimit(app);

registerLockfileRoute(app);
registerSnapshotRoute(app);
registerFilesRoute(app);

app.get("/", (c) => {
  return c.json({
    name: "UCD Store API",
    description: "Filesystem-style interface for Unicode Character Database files",
    version: "1.0.0",
    endpoints: {
      lockfile: "GET /.ucd-store.lock",
      snapshot: "GET /{version}/snapshot.json",
      files: "GET /{version}/{filepath}",
    },
    documentation: "https://docs.ucdjs.dev",
  });
});

app.onError(errorHandler);
app.notFound(notFoundHandler);

export default app;

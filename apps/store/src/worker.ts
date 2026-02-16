import type { HonoEnv } from "./types";
import * as Sentry from "@sentry/cloudflare";
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
    documentation: "https://ucdjs.dev/docs",
  });
});

app.onError(errorHandler);
app.notFound(notFoundHandler);

export default Sentry.withSentry((env: HonoEnv["Bindings"]) => {
  const { id: versionId } = env.CF_VERSION_METADATA;

  return {
    dsn: "https://29f2e9a8606ffa38a83a3e66cb2a95de@o4510553981714432.ingest.de.sentry.io/4510553988399184",
    release: versionId,
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration/options/#sendDefaultPii
    sendDefaultPii: false,
    enabled: env.ENVIRONMENT !== "testing",
  };
}, {
  fetch: (request, env, ctx) => {
    return app.fetch(request, env, ctx);
  },
});

import type { HonoEnv } from "./types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import * as Sentry from "@sentry/cloudflare";
import { env } from "hono/adapter";
import { errorHandler, notFoundHandler } from "./lib/handlers";
import { setupCors, setupRatelimit } from "./lib/setups";
import { buildOpenApiConfig, registerApp } from "./openapi";
import { WELL_KNOWN_ROUTER } from "./routes/.well-known/router";
import { TASKS_ROUTER } from "./routes/tasks/routes";
import { V1_FILES_ROUTER } from "./routes/v1_files/router";
import { V1_SCHEMAS_ROUTER } from "./routes/v1_schemas/router";
import { V1_VERSIONS_ROUTER } from "./routes/v1_versions/router";
import { UCD_STORE_ROUTER } from "./ucd-store/router";

const app = new OpenAPIHono<HonoEnv>();

registerApp(app);
setupCors(app);
setupRatelimit(app);

app.route("/", V1_VERSIONS_ROUTER);
app.route("/", V1_FILES_ROUTER);
app.route("/", V1_SCHEMAS_ROUTER);
app.route("/", WELL_KNOWN_ROUTER);
app.route("/", TASKS_ROUTER);

app.get(
  "/",
  Scalar({
    url: "/openapi.json",
    layout: "modern",
    customCss: /* css */`
    .endpoint-label-path {
      display: none !important;
    }

    .show-api-client-button {
      background: var(--theme-color-accent) !important;
    }

    .scalar-codeblock-code {
      display: unset;
    }

    :root {
      --theme-color-accent: rgb(59, 130, 246);
      --theme-color-background: hsla(348, 71%, 93%, 1);
      --scalar-api-client-color: var(--theme-color-accent);
      --scalar-background-1: hsla(241.9, 6.3926%, 10.038%) !important;
    }

    .dark-mode {
      --scalar-background-1: hsla(241.9, 6.3926%, 10.038%) !important;
      --scalar-color-accent: rgb(59, 130, 246) !important;
      --scalar-color-background: hsla(348, 24%, 12%, 1) !important;
      }
    `,
  }),
);

app.doc31("/openapi.json", (c) => {
  const server = {
    url: "https://api.ucdjs.dev",
    description: "Production Environment",
  };

  if (c.env.ENVIRONMENT === "preview") {
    server.url = "https://preview.api.ucdjs.dev";
    server.description = "Preview Environment";
  }

  if (c.env.ENVIRONMENT === "local") {
    server.url = "http://localhost:8787";
    server.description = "Local Environment";
  }

  return buildOpenApiConfig(env(c).API_VERSION || "x.y.z", [
    server,
  ]);
});

app.onError(errorHandler);
app.notFound(notFoundHandler);

export const getOpenAPI31Document = app.getOpenAPI31Document;

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
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Check if this is a store subdomain
    const isStoreSubdomain
      = hostname === "ucd-store.ucdjs.dev" // production
        || hostname === "preview.ucd-store.ucdjs.dev" // preview
        || (hostname === "ucd-store.localhost"); // local testing

    if (isStoreSubdomain) {
      return UCD_STORE_ROUTER.fetch(request, env, ctx);
    }

    return app.fetch(request, env, ctx);
  },
});

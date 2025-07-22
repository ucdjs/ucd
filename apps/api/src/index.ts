import type { HonoEnv } from "./types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { errorHandler, notFoundHandler, setupCors } from "@ucdjs/worker-shared";
import { env } from "hono/adapter";
import { buildOpenApiConfig, registerApp } from "./openapi";
import { V1_UNICODE_PROXY_ROUTER } from "./routes/v1_unicode-proxy";
import { V1_VERSIONS_ROUTER } from "./routes/v1_versions";

const app = new OpenAPIHono<HonoEnv>();

registerApp(app);
setupCors(app);

app.route("/", V1_UNICODE_PROXY_ROUTER);
app.route("/", V1_VERSIONS_ROUTER);

app.get(
  "/scalar",
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

export default app;

import type { HonoEnv } from "./types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import {
  errorHandler,
  notFoundHandler,
} from "@ucdjs-internal/worker-utils";
import { setupCors, setupRatelimit } from "@ucdjs-internal/worker-utils/setups";
import { env } from "hono/adapter";
import { buildOpenApiConfig, registerApp } from "./openapi";
import { TASKS_ROUTER } from "./routes/tasks/routes";
import { V1_FILES_ROUTER } from "./routes/v1_files/router";
import { V1_REPORTS_ROUTER } from "./routes/v1_reports/router";
import { V1_SCHEMAS_ROUTER } from "./routes/v1_schemas/router";
import { V1_VERSIONS_ROUTER } from "./routes/v1_versions/router";
import { WELL_KNOWN_ROUTER } from "./routes/well-known/router";

const app = new OpenAPIHono<HonoEnv>();

registerApp(app);
setupCors(app);
setupRatelimit(app);

app.route("/", V1_VERSIONS_ROUTER);
app.route("/", V1_FILES_ROUTER);
app.route("/", V1_REPORTS_ROUTER);
app.route("/", V1_SCHEMAS_ROUTER);
app.route("/", WELL_KNOWN_ROUTER);
app.route("/", TASKS_ROUTER);

app.get("/", (c, next) => {
  const accept = c.req.header("accept")?.toLowerCase() ?? "";
  const wantsHtml = accept
    .split(",")
    .map((value) => value.trim().split(";", 1)[0])
    .includes("text/html");

  if (wantsHtml) {
    return Scalar<HonoEnv>({
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
    })(c, next) as Promise<Response>;
  }

  const origin = new URL(c.req.url).origin;
  const apiResourcesWithRoot = new Set<string>();
  const endpoints = new Map<string, string>();

  for (const route of app.routes) {
    const segments = route.path.split("/").filter(Boolean);

    if (
      route.method === "GET"
      && segments[0] === "api"
      && segments[1]?.startsWith("v")
      && (segments.length === 3 || segments[3]?.endsWith("?"))
    ) {
      apiResourcesWithRoot.add(`${segments[1]}/${segments[2]}`);
    }
  }

  for (const route of app.routes) {
    if (route.method !== "GET" || route.path === "/") continue;

    const segments = route.path.split("/").filter(Boolean);

    if (segments[0] === "api" && segments[1]?.startsWith("v") && segments[2]) {
      if (segments[2] === "schemas") continue;

      if (apiResourcesWithRoot.has(`${segments[1]}/${segments[2]}`)) {
        endpoints.set(`${segments[2]}_url`, `${origin}/api/${segments[1]}/${segments[2]}`);
      } else {
        const key = segments
          .slice(2)
          .map((segment) => {
            if (segment.startsWith(":")) return segment.slice(1).split("{", 1)[0];
            if (segment.endsWith(".json")) return segment.slice(0, -5);
            return segment;
          })
          .join("_");

        endpoints.set(`${key}_url`, `${origin}${route.path}`);
      }

      continue;
    }

    if (segments[0] === ".well-known") {
      endpoints.set("well_known_url", `${origin}/.well-known/ucd-config.json`);
      continue;
    }

    if (segments[0] === "openapi.json") {
      endpoints.set("openapi_url", `${origin}/openapi.json`);
    }
  }

  return c.json(Object.fromEntries(endpoints));
});

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

export const getOpenAPI31Document: OpenAPIHono<HonoEnv>["getOpenAPI31Document"] = app.getOpenAPI31Document;

export default app;

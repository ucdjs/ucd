import type { OpenAPIHono } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";

export type OpenAPIObjectConfig = Parameters<OpenAPIHono["getOpenAPI31Document"]>[0];

export function buildOpenApiConfig(version: string, servers: NonNullable<OpenAPIObjectConfig["servers"]>) {
  return {
    openapi: "3.0.0",
    info: {
      title: "UCD.js API",
      description: `UCD.js API Documentation
      This API provides endpoints to access unicode characters, and a lot more.`,
      version,
      license: {
        name: "MIT",
        url: "https://github.com/ucdjs/api.ucdjs.dev/blob/main/LICENSE",
      },
      contact: {
        name: "UCD.js",
        url: "https://ucdjs.dev",
        email: "mail@ucdjs.dev",
      },
    },
    tags: [
      {
        name: "Misc",
        description: "Endpoints that don't fit into other categories.",
      },
      {
        name: "Unicode Proxy",
        description: dedent`
          Endpoints for proxying requests to unicode-proxy.ucdjs.dev.

          Just call the single endpoint with the path you want to proxy, and don't think about there being any other endpoints.
          This is a fix for OpenAPI not supporting splat routes.
        `,
      },
    ],
    servers,
  } satisfies OpenAPIObjectConfig;
}

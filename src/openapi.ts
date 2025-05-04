import type { OpenAPIHono } from "@hono/zod-openapi";

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
    ],
    servers,
  } satisfies OpenAPIObjectConfig;
}

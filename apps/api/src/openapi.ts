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

          The \`wildcard\` parameter in the path allows you to match any path.
          For example, if you want to get the \`UnicodeData.txt\` file for Unicode version 15.0.0, you can use the following wildcard path parameter: \`15.0.0/ucd/UnicodeData.txt\`.
        `,
      },
    ],
    servers,
  } satisfies OpenAPIObjectConfig;
}

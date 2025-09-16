import type { OpenAPIHono } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { createResponseComponentBuilder } from "./lib/openapi";

export type OpenAPIObjectConfig = Parameters<OpenAPIHono["getOpenAPI31Document"]>[0];

export const OPENAPI_TAGS = {
  VERSIONS: "Versions",
  FILES: "Files",
} as const satisfies Record<string, string>;

export const { generateReferences, registerApp } = createResponseComponentBuilder([
  400,
  404,
  429,
  500,
  502,
]);

export type OpenAPITag = typeof OPENAPI_TAGS[keyof typeof OPENAPI_TAGS];

export function buildOpenApiConfig(version: string, servers: NonNullable<OpenAPIObjectConfig["servers"]>) {
  return {
    openapi: "3.1.0",
    info: {
      title: "UCD.js API",
      description: dedent`
        Welcome to the UCD.js API - your comprehensive gateway to Unicode character data and related information.

        ## What is UCD.js?
        UCD.js provides programmatic access to Unicode Character Database (UCD) information through a modern API.
        Whether you're building applications that need Unicode character properties, text processing tools, or
        internationalization features, this API has you covered.

        > [!NOTE]
        > Some endpoints are specific to the internals of UCD.js, and may not be relevant for general use.

        ## Caching
        This API caches responses to improve performance and reduce load on the Unicode data sources.

        Some endpoints may have longer cache durations than others to optimize performance

        ## Rate Limiting & Fair Use
        This API is provided as a public service. Please be respectful with your usage:
        - Avoid making excessive requests in short time periods
        - Consider caching responses when appropriate
        - Heavy usage may be rate limited to ensure fair access for all users

        ## Support & Feedback
        Found an issue or have suggestions? We'd love to hear from you!
        Visit our [GitHub repository](https://github.com/ucdjs/ucd) or contact us directly.
      `,
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
        name: OPENAPI_TAGS.FILES,
        description: dedent`
          Proxy endpoints for accessing Unicode data files and directories.

          These endpoints provide secure access to official Unicode data through our API,
          with built-in caching and path validation. Detailed usage examples and path
          formats are documented in the individual endpoint specifications.
        `,
      },
      {
        name: OPENAPI_TAGS.VERSIONS,
        description: dedent`
          Endpoints for accessing information about Unicode versions.

          These endpoints allow you to retrieve metadata about different Unicode versions,
          including version numbers, release dates, and available data files.

          They also contain endpoints for listing all available Unicode versions,
          retrieving the latest version, and accessing specific version metadata.
        `,
      },
    ],
    servers,
  } satisfies OpenAPIObjectConfig;
}

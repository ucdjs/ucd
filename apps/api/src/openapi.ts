import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Prettify, RemoveIndexSignature } from "@luxass/utils";
import { dedent } from "@luxass/utils";
import { createResponseComponentBuilder } from "@ucdjs/worker-shared";

export type OpenAPIObjectConfig = Parameters<OpenAPIHono["getOpenAPI31Document"]>[0];

export const OPENAPI_TAGS = {
  MISC: "Misc",
  RAW: "Raw",
  VERSIONS: "Versions",
  LIL: "",
} as const satisfies Record<string, string>;

export const { generateReferences, registerApp } = createResponseComponentBuilder([
  400,
  404,
  429,
  500,
  502,
  503,
]);

export type OpenAPITag = typeof OPENAPI_TAGS[keyof typeof OPENAPI_TAGS];

export function buildOpenApiConfig(version: string, servers: NonNullable<OpenAPIObjectConfig["servers"]>) {
  return {
    openapi: "3.1.0",
    info: {
      title: "UCD.js API",
      description: dedent`
        # UCD.js API Documentation

        Welcome to the UCD.js API - your comprehensive gateway to Unicode character data and related information.

        ## What is UCD.js?
        UCD.js provides programmatic access to Unicode Character Database (UCD) information through a modern, RESTful API.
        Whether you're building applications that need Unicode character properties, text processing tools, or
        internationalization features, this API has you covered.

        ## Key Features
        - **Unicode Character Data**: Access detailed information about Unicode characters
        - **Proxy Endpoints**: Direct access to official Unicode data files
        - **Multiple Formats**: JSON responses for structured data, raw files for direct access
        - **Version Support**: Access current and historical Unicode versions
        - **RESTful Design**: Clean, predictable URL patterns and HTTP methods
        - **OpenAPI Specification**: Full API documentation with examples

        ## Getting Started
        All endpoints are accessible via HTTPS and return JSON data unless specified otherwise.
        No authentication is required for basic usage.

        ## Rate Limiting & Fair Use
        This API is provided as a public service. Please be respectful with your usage:
        - Avoid making excessive requests in short time periods
        - Consider caching responses when appropriate
        - Heavy usage may be rate limited to ensure fair access for all users

        ## Support & Feedback
        Found an issue or have suggestions? We'd love to hear from you!
        Visit our GitHub repository or contact us directly.
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
        name: OPENAPI_TAGS.RAW,
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

import type { OpenAPIHono } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";

export type OpenAPIObjectConfig = Parameters<OpenAPIHono["getOpenAPI31Document"]>[0];

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
        name: "Files",
        description: dedent`
          Endpoints for accessing Unicode data files directly.

          These endpoints provide a straightforward way to retrieve Unicode data files
          without any additional processing or transformation.
        `,
      },
      {
        name: "Misc",
        description: dedent`
          Miscellaneous endpoints that don't fit into other categories.

          These endpoints typically provide utility functions, health checks,
          API information, and other general-purpose functionality.
        `,
      },
      {
        name: "Unicode Proxy",
        description: dedent`
          Proxy endpoints for accessing Unicode data files from unicode-proxy.ucdjs.dev.

          ## How it works
          These endpoints act as a proxy to the official Unicode data repository,
          allowing you to access Unicode data files through our API without
          needing to make direct requests to the Unicode servers.

          ## Wildcard Pattern
          The wildcard parameter allows you to specify any path within the Unicode data structure.
          This means you can access specific files, directories, or even entire versions of Unicode data.
          For example, you can see the paths defined below:

          ## Common Usage Examples
          - \`/latest/ucd/UnicodeData.txt\` - Get the latest UnicodeData.txt file
          - \`/15.0.0/ucd/UnicodeData.txt\` - Get UnicodeData.txt for Unicode version 15.0.0
          - \`/latest/ucd/auxiliary/GraphemeBreakProperty.txt\` - Access files in subdirectories
          - \`/14.0.0/ucd/extracted/DerivedCombiningClass.txt\` - Access extracted data files
        `,
      },
      {
        name: "Unicode Releases",
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

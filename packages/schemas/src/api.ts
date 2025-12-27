import { dedent } from "@luxass/utils";
import { z } from "zod";

export const ApiErrorSchema = z.object({
  message: z.string().meta({
    description: "Human-readable error message describing what went wrong",
  }),
  status: z.number().meta({
    description: "HTTP status code matching the response status",
  }),
  timestamp: z.string().meta({
    description: "ISO 8601 timestamp when the error occurred",
  }),
}).meta({
  description: dedent`
    Standard error response format used consistently across all API endpoints.

    Contains essential information for debugging and user feedback. The specific error scenarios and status codes are documented in the individual endpoint response definitions.
  `,
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Schema for .well-known/ucd-config.json endpoint configuration
 */
export const UCDWellKnownConfigSchema = z.object({
  /**
   * Schema version for future compatibility
   */
  version: z.string().default("1.0"),

  /**
   * API endpoints configuration
   */
  endpoints: z.object({
    /**
     * Base path for file operations
     * @example "/api/v1/files"
     */
    files: z.string(),

    /**
     * Path to manifest file (deprecated)
     * @deprecated Use per-version endpoint `/.well-known/ucd-store/{version}.json` instead
     * @example "/.well-known/ucd-store/{version}.json"
     */
    manifest: z.string(),

    /**
     * Path to versions endpoint
     * @example "/api/v1/versions"
     */
    versions: z.string(),
  }),

  /**
   * List of available Unicode versions
   * This array contains all versions that have manifests available.
   */
  versions: z.array(z.string()).default([]),
}).meta({
  id: "UCDWellKnownConfig",
  description: dedent`
    Configuration schema for the .well-known/ucd-config.json endpoint.

    This configuration provides clients with the necessary information to interact with the UCD API server, including endpoint paths and optional metadata about the server itself.

    The \`manifest\` endpoint is deprecated. Use the per-version endpoint \`/.well-known/ucd-store/{version}.json\` instead for better performance and caching.
  `,
});

export type UCDWellKnownConfig = z.infer<typeof UCDWellKnownConfigSchema>;

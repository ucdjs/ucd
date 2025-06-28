import type { Client } from "openapi-fetch";
import type { components, paths } from "./.generated/api";
import OpenApiCreateClient from "openapi-fetch";

/**
 * Creates a configured API client for making requests to Unicode API endpoints
 *
 * @param {string} baseUrl - The base URL for the API server
 * @returns {Client<paths, `${string}/${string}`>} A configured client instance with predefined headers
 */
export function createClient(baseUrl: string): Client<paths, `${string}/${string}`> {
  return OpenApiCreateClient<paths>({
    baseUrl,
    fetch: (...args) => fetch(...args),
  });
}

/**
 * A pre-configured API client instance for the Unicode API
 * Uses the default base URL: https://api.ucdjs.dev
 *
 * @example
 * ```ts
 * import { client } from "@ucdjs/fetch";
 *
 * // Make a request using the pre-configured client
 * const response = await client.GET("/path/to/endpoint");
 * ```
 */
export const client = createClient("https://api.ucdjs.dev");

export type UnicodeVersion = components["schemas"]["UnicodeVersion"];
export type UnicodeVersions = components["schemas"]["UnicodeVersions"];
export type ApiError = components["schemas"]["ApiError"];
export type ProxyResponse = components["schemas"]["ProxyResponse"];
export type ProxyFileResponse = components["schemas"]["ProxyFileResponse"];
export type ProxyDirectoryResponse = components["schemas"]["ProxyDirectoryResponse"];
// export type UnicodeVersionMappings = components["schemas"]["UnicodeVersionMappings"];
// export type UnicodeVersionFile = components["schemas"]["UnicodeVersionFile"];
// export type UnicodeVersionFiles = components["schemas"]["UnicodeVersionFiles"];

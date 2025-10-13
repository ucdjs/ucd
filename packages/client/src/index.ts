import type { Client } from "openapi-fetch";
import type { paths } from "./.generated/api";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import OpenApiCreateClient from "openapi-fetch";

export type UCDClient = Client<paths, `${string}/${string}`>;

/**
 * Creates a configured API client for making requests to Unicode API endpoints
 *
 * @param {string} baseUrl - The base URL for the API server
 * @returns {UCDClient} A configured client instance with predefined headers
 */
export function createClient(baseUrl: string): UCDClient {
  return OpenApiCreateClient<paths>({
    baseUrl,
    fetch: (...args) => fetch(...args),
    pathSerializer(pathname, pathParams) {
      let result = pathname;
      for (const [key, value] of Object.entries(pathParams)) {
        result = result.replace(`{${key}}`, `${value}`);
      }
      return result;
    },
  });
}

/**
 * A pre-configured API client instance for the Unicode API
 * Uses the default base URL: "https://api.ucdjs.dev"
 *
 * @example
 * ```ts
 * import { client } from "@ucdjs/client";
 *
 * // Make a request using the pre-configured client
 * const response = await client.GET("/path/to/endpoint");
 * ```
 */
export const client = createClient(UCDJS_API_BASE_URL);

export * from "./guards";

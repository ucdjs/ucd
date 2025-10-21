import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import { UCDWellKnownConfigSchema } from "@ucdjs/schemas";
import { customFetch } from "./fetch/fetch";

/**
 * Fetches and validates the UCD well-known configuration from a server
 *
 * @param {string} baseUrl - The base URL of the UCD server
 * @returns {Promise<UCDWellKnownConfig>} The validated well-known configuration
 * @throws {Error} If the config cannot be fetched or is invalid
 */
export async function discoverEndpointsFromConfig(baseUrl: string): Promise<UCDWellKnownConfig> {
  const url = new URL("/.well-known/ucd-config.json", baseUrl);

  const fetchResult = await customFetch.safe<UCDWellKnownConfig>(url.toString(), {
    parseAs: "json",
  });

  if (fetchResult.error) {
    throw fetchResult.error;
  }

  const result = UCDWellKnownConfigSchema.safeParse(fetchResult.data);

  if (!result.success) {
    throw new Error(
      `Invalid well-known config: ${result.error.message}`,
    );
  }

  return result.data;
}

/**
 * Return the default UCD well-known configuration used by the library.
 *
 * This function returns the build-time injected __UCD_ENDPOINT_DEFAULT_CONFIG__ if present;
 * otherwise it falls back to a hard-coded default object containing a version and
 * the common API endpoint paths for files, manifest and versions.
 *
 * The returned value conforms to the UCDWellKnownConfig schema and is used when
 * discovery via discoverEndpointsFromConfig() is not possible or a local default
 * is required.
 *
 * @returns {UCDWellKnownConfig} The default well-known configuration.
 */
export function getDefaultUCDEndpointConfig(): UCDWellKnownConfig {
  // @ts-expect-error We haven't typed the globalThis injection yet
  // This is mostly because, if we let's say, wrap the globalThis in
  // `(globalThis as typeof globalThis & { __UCD_ENDPOINT_DEFAULT_CONFIG__?: UCDWellKnownConfig })`
  // The `replacePlugin` will not collapse the condition, and the resulting code looks ugly.
  return globalThis.__UCD_ENDPOINT_DEFAULT_CONFIG__ ?? {
    version: "0.1",
    endpoints: {
      files: "/api/v1/files",
      manifest: "/api/v1/files/.ucd-store.json",
      versions: "/api/v1/versions",
    },
  };
}

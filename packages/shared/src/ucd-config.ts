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

import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import { customFetch } from "@ucdjs-internal/shared";
import { UCDWellKnownConfigSchema } from "@ucdjs/schemas";

export interface ConfigResource {
  /**
   * Get the UCD configuration including endpoints and available versions
   * @returns {Promise<SafeFetchResponse<UCDWellKnownConfig>>} The UCD configuration
   */
  get: () => Promise<SafeFetchResponse<UCDWellKnownConfig>>;
}

export interface CreateConfigResourceOptions {
  baseUrl: string;
}

export function createConfigResource(options: CreateConfigResourceOptions): ConfigResource {
  const { baseUrl } = options;

  return {
    async get() {
      const url = new URL("/.well-known/ucd-config.json", baseUrl);
      return customFetch.safe<UCDWellKnownConfig>(url.toString(), {
        parseAs: "json",
        schema: UCDWellKnownConfigSchema,
      });
    },
  };
}

import type { MockStoreConfig } from "./types";
import { mockFetch } from "../msw";
import { MOCK_ROUTES } from "./handlers";
import {
  extractConfiguredMetadata,
  parseLatency,
  wrapMockFetch,
} from "./utils";

export function mockStoreApi(config?: MockStoreConfig): void {
  const {
    baseUrl = "https://api.ucdjs.dev",
    responses,
    versions = ["16.0.0", "15.1.0", "15.0.0"],
    customResponses = [],
  } = config || {};

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  for (const route of MOCK_ROUTES) {
    const endpoint = route.endpoint;

    // Every endpoint is optional, but by default enabled
    const response = responses?.[endpoint as keyof typeof responses] ?? true;

    // If explicitly disabled, skip
    if (response === false) continue;

    const shouldUseDefaultValue = response === true || response == null;

    // extract metadata from configure
    const { actualResponse, latency, headers } = extractConfiguredMetadata(response);

    const wrappedMockFetch = wrapMockFetch(mockFetch, {
      beforeFetch: async () => {
        // apply latency before calling resolver
        if (latency) {
          const ms = parseLatency(latency);
          await new Promise((resolve) => setTimeout(resolve, ms));
        }
      },
      afterFetch(response) {
        if (
          !headers
          || !("headers" in response)
          || !(response.headers instanceof Headers)
        ) {
          return;
        }

        for (const [key, value] of Object.entries(headers)) {
          const current = response.headers.get(key);
          if (current !== value) response.headers.set(key, value);
        }
      },
    });

    const mswPath = toMSWPath(endpoint);

    route.setup({
      url: `${normalizedBaseUrl}${mswPath}`,
      // TypeScript cannot infer that `endpoint` is always a key of `responses` here,
      // because `endpoint` comes from MOCK_ROUTES and `responses` is user-provided.
      // We assert the type here because we know from the context that `endpoint` is intended
      // to match the keys of `responses`, and `actualResponse` is the value for that key.
      providedResponse: actualResponse as any,
      shouldUseDefaultValue,
      mockFetch: wrappedMockFetch,
      versions,
    });
  }

  if (customResponses.length > 0) {
    mockFetch(customResponses);
  }
}

function toMSWPath(endpoint: string): string {
  return endpoint.replace(/\{(\w+)\}/g, (_, p1) => {
    if (p1 === "wildcard") {
      return "*";
    }

    return `:${p1}`;
  });
}

export type { MockStoreConfig };
export { configure, unsafeResponse } from "./helpers";

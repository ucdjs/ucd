import type { MockStoreConfig } from "./types";
import { mockFetch } from "../msw";
import { MOCK_ROUTES } from "./handlers";
import { extractConfigMetadata, wrapMockFetchWithConfig } from "./utils";

export function mockStoreApi(config?: MockStoreConfig): void {
  const {
    baseUrl = "https://api.ucdjs.dev",
    responses,
    versions = ["16.0.0", "15.1.0", "15.0.0"],
  } = config || {};

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  for (const route of MOCK_ROUTES) {
    const endpoint = route.endpoint;

    // Every endpoint is optional, but by default enabled
    const response = responses?.[endpoint as keyof typeof responses] ?? true;

    // If explicitly disabled, skip
    if (response === false) continue;

    const shouldUseDefaultValue = response === true || response == null;

    // Extract configuration metadata from response
    const { actualResponse, latency, headers } = extractConfigMetadata(response);

    // Create wrapped mockFetch with latency and headers handling
    const configuredMockFetch = wrapMockFetchWithConfig(mockFetch, latency, headers);

    const mswPath = endpoint.replace(/\{(\w+)\}/g, (_, p1) => {
      if (p1 === "wildcard") {
        return "*";
      }

      return `:${p1}`;
    });

    route.setup({
      url: `${normalizedBaseUrl}${mswPath}`,
      // @ts-expect-error - TS can't infer that endpoint is keyof responses here
      providedResponse: actualResponse,
      shouldUseDefaultValue,
      mockFetch: configuredMockFetch,
      versions,
    });
  }
}

export type { MockStoreConfig };
export { configure } from "./utils";

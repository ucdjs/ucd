import type { InferEndpointConfig } from "./define";
import { mockFetch } from "../msw";
import { fileTreeRoute } from "./handlers/file-tree";
import { filesRoute, storeManifestRoute } from "./handlers/files";
import { versionsRoute } from "./handlers/versions";
import { wellKnownConfig } from "./handlers/well-known";

const MOCK_ROUTES = [
  filesRoute,
  fileTreeRoute,
  wellKnownConfig,
  storeManifestRoute,
  versionsRoute,
] as const;

type DerivedEndpointConfig = InferEndpointConfig<typeof MOCK_ROUTES>;

type DerivedResponses = Partial<{
  [K in keyof DerivedEndpointConfig]: false | DerivedEndpointConfig[K];
}>;

export interface MockStoreConfig {
  /**
   * The base URL for the store.
   *
   * @default "https://api.ucdjs.dev"
   */
  baseUrl?: string;

  /**
   * The responses to mock for the store endpoints.
   *
   * NOTE:
   * If the value provided is `true`, then a default handler will be used.
   * If the value is `false`, then no handler will be used.
   * If the value provided is a specific response, then that response will be used.
   */
  responses?: DerivedResponses;

  /**
   * The versions to use for placeholders
   * @default ["16.0.0","15.1.0","15.0.0"]
   */
  versions?: string[];
}

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

    const mswPath = endpoint.replace(/\{(\w+)\}/g, ":$1");

    route.setup({
      url: `${normalizedBaseUrl}${mswPath}`,
      // @ts-expect-error - TS can't infer that endpoint is keyof responses here
      providedResponse: response,
      shouldUseDefaultValue,
      mockFetch,
      versions,
    });
  }
}

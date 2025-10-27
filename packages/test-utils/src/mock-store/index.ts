import type { JsonBodyType } from "msw";
import type { MockStoreConfig } from "./types";
import { createDebugger, isApiError } from "@ucdjs-internal/shared";
import { HttpResponse } from "msw";
import { mockFetch } from "../msw";
import { MOCK_ROUTES } from "./handlers";
import {
  extractConfiguredMetadata,
  parseLatency,
  wrapMockFetch,
} from "./utils";

const debug = createDebugger("ucdjs:test-utils:mock-store");

export function mockStoreApi(config?: MockStoreConfig): void {
  const {
    baseUrl = "https://api.ucdjs.dev",
    responses,
    versions = ["16.0.0", "15.1.0", "15.0.0"],
    customResponses = [],
    onRequest,
  } = config || {};

  debug?.("Setting up mock store API with config:", config);

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  for (const route of MOCK_ROUTES) {
    const endpoint = route.endpoint;

    // Every endpoint is optional, but by default enabled
    const response = responses?.[endpoint as keyof typeof responses] ?? true;

    // If explicitly disabled, skip
    if (response === false) continue;

    const shouldUseDefaultValue = response === true || response == null;

    // extract metadata from configure
    let { actualResponse, latency, headers } = extractConfiguredMetadata(response);
    debug?.(`Setting up mock for endpoint: ${endpoint} with response:`, actualResponse);

    if (isApiError(actualResponse)) {
      debug?.(`Detected ApiError-like response for endpoint: ${endpoint}`);
      // If the configured response is an error, short-circuit here
      // This prevents issues where we return an error object to a resolver
      // that doesn't get transformed into an actual error response
      // eslint-disable-next-line prefer-const
      let tmp = actualResponse;
      function newHandler(): HttpResponse<JsonBodyType> {
        return HttpResponse.json(tmp as any, {
          status: (tmp as any).status,
        });
      }
      actualResponse = newHandler;
    }

    const wrappedMockFetch = wrapMockFetch(mockFetch, {
      onRequest,
      beforeFetch: async () => {
        debug?.("Before fetch for endpoint:", endpoint);
        // apply latency before calling resolver
        if (latency) {
          const ms = parseLatency(latency);
          await new Promise((resolve) => setTimeout(resolve, ms));
        }
      },
      afterFetch({ response }) {
        debug?.("After fetch for endpoint:", endpoint);
        if (!response) {
          debug?.("No response returned from resolver");
          return;
        }

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
    debug?.(`MSW path for endpoint ${endpoint}: ${mswPath}`);

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
    debug?.("Setting up custom responses");
    mockFetch(customResponses);
  }
}

function toMSWPath(endpoint: string): string {
  return endpoint.replace(/\{(\w+)\}/g, (_, p1) => {
    // This plays nicely with the change we made
    // for :wildcard+ in our wrap mock fetch logic
    // https://github.com/ucdjs/ucd/blob/43640a1e2a905f669708a76c8193558429d36df3/packages/test-utils/src/mock-store/utils.ts#L95-L106
    if (p1 === "wildcard") {
      return `:${p1}+`;
    }

    return `:${p1}`;
  });
}

export type { MockStoreConfig };
export { configure, unsafeResponse } from "./helpers";

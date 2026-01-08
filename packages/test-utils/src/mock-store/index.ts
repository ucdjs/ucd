import type { JsonBodyType } from "msw";
import type { MockStoreConfig, MockStoreFiles } from "./types";
import { createDebugger, isApiError } from "@ucdjs-internal/shared";
import { HttpResponse } from "msw";
import { mockFetch } from "../msw";
import { defaultArabicShapingFileContent } from "./default-files/arabic-shaping";
import { defaultBidiBracketsFileContent } from "./default-files/bidi-brackets";
import { defaultDerivedBidClassFileContent } from "./default-files/derived-bidi-class";
import { MOCK_ROUTES } from "./handlers";

import {
  extractConfiguredMetadata,
  parseLatency,
  wrapMockFetch,
} from "./utils";

const debug = createDebugger("ucdjs:test-utils:mock-store");

const DEFAULT_MOCK_STORE_FILES = {
  "*": [
    {
      type: "file",
      name: "ArabicShaping.txt",
      lastModified: 1755287100000,
      _content: defaultArabicShapingFileContent,
    },
    {
      type: "file",
      name: "BidiBrackets.txt",
      lastModified: 1755287100000,
      _content: defaultBidiBracketsFileContent,
    },
    {
      type: "directory",
      name: "extracted",
      lastModified: 1755287100000,
      children: [
        {
          type: "file",
          name: "DerivedBidiClass.txt",
          lastModified: 1755287100000,
          _content: defaultDerivedBidClassFileContent,
        },
      ],
    },
  ],
} satisfies MockStoreFiles;

export function mockStoreApi(config?: MockStoreConfig): void {
  const {
    baseUrl = "https://api.ucdjs.dev",
    responses,
    versions = ["16.0.0", "15.1.0", "15.0.0"],
    customResponses = [],
    onRequest,
    files = DEFAULT_MOCK_STORE_FILES,
  } = config || {};

  debug?.("Setting up mock store API with config:", config);

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  for (const route of MOCK_ROUTES) {
    const endpoint = route.endpoint;

    // Every endpoint is optional, but by default enabled
    const response = responses?.[endpoint as keyof typeof responses] ?? false;

    // If explicitly disabled, skip
    if (response === false) continue;

    // extract metadata from configure
    let { actualResponse, latency, headers, beforeHook, afterHook } = extractConfiguredMetadata(response);

    // Normalize wrapped true object back to true for handlers
    if (typeof actualResponse === "object" && actualResponse !== null && "__useDefaultResolver" in actualResponse) {
      actualResponse = true;
    }

    // Check if we should use default value (true or null)
    const shouldUseDefaultValue = actualResponse === true || response == null;
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
      beforeFetch: async (payload) => {
        debug?.("Before fetch for endpoint:", endpoint);
        // apply latency before calling resolver
        if (latency) {
          const ms = parseLatency(latency);
          await new Promise((resolve) => setTimeout(resolve, ms));
        }
        // call before hook if configured
        await beforeHook?.(payload);
      },
      afterFetch: async ({ response, ...payload }) => {
        debug?.("After fetch for endpoint:", endpoint);
        // call after hook if configured
        await afterHook?.({ ...payload, response });

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
      files,
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
    // for :wildcard* in our wrap mock fetch logic
    // https://github.com/ucdjs/ucd/blob/c662bec8429c98e5fd98942e2c12f0e6fd479d51/packages/test-utils/src/mock-store/utils.ts#L94-L105
    if (p1 === "wildcard") {
      return `:${p1}*`;
    }

    return `:${p1}`;
  });
}

export type { MockStoreConfig };
export { createFileTree } from "./file-tree";
export type { FileTreeInput, FileTreeNodeWithContent } from "./file-tree";
export { configure, unsafeResponse } from "./helpers";

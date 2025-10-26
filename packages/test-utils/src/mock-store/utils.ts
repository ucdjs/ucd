import type { MockFetchFn } from "@luxass/msw-utils";
import type { HttpResponseResolver } from "msw";
import type {
  CallbackRequestPayload,
  ConfiguredResponse,
  MockFetchType,
  OnAfterMockFetchCallback,
  OnBeforeMockFetchCallback,
  OnRequestCallback,
} from "./types";
import { createDebugger } from "@ucdjs-internal/shared";
import { kConfiguredResponse } from "./helpers";

const debug = createDebugger("ucdjs:test-utils:mock-store:utils");

export function parseLatency(latency: number | "random"): number {
  if (latency === "random") {
    // random latency between 100ms and 999ms
    return Math.floor(Math.random() * 900) + 100;
  }

  return latency;
}

export function isConfiguredResponse(value: unknown): value is ConfiguredResponse<any> {
  return (typeof value === "object" || typeof value === "function")
    && value !== null
    && kConfiguredResponse in (value as object);
}

export function extractConfiguredMetadata(response: unknown): {
  actualResponse: unknown;
  latency?: number | "random";
  headers?: Record<string, string>;
} {
  if (isConfiguredResponse(response)) {
    const meta = (response as any)[kConfiguredResponse] as {
      latency?: number | "random";
      headers?: Record<string, string>;
    };

    return {
      actualResponse: response,
      latency: meta.latency,
      headers: meta.headers,
    };
  }

  return { actualResponse: response };
}

export function wrapMockFetch(
  originalMockFetch: MockFetchFn,
  callbacks?: {
    onRequest?: OnRequestCallback;
    beforeFetch?: OnBeforeMockFetchCallback;
    afterFetch?: OnAfterMockFetchCallback;
  },
): MockFetchFn {
  const {
    beforeFetch,
    afterFetch,
    onRequest,
  } = callbacks || {};

  debug?.("Wrapping mockFetch with beforeFetch=%s, afterFetch=%s, onRequest=%s");

  if (!beforeFetch && !afterFetch && !onRequest) {
    debug?.("No callbacks configured, returning original mockFetch");
    // no configuration, return original
    return originalMockFetch;
  }

  return ((...args: Parameters<MockFetchFn>) => {
    const routes = args[0];

    // If routes is an array of tuples, wrap the resolvers
    if (Array.isArray(routes)) {
      debug?.("Routes is an array, wrapping resolvers");

      const wrappedRoutes = routes.map((route) => {
        if (!Array.isArray(route) || route.length < 3) {
          return route;
        }

        const [method, url, resolver] = route;

        // only wrap if resolver is a function
        if (typeof resolver !== "function") {
          debug?.("Resolver is not a function, returning original route");
          return route;
        }

        const wrappedResolver: HttpResponseResolver = async (args) => {
          const callbackRequestPayload = {
            endpoint: route[1],
            method: args.request.method,
            params: args.params,
            url: args.request.url,
          } satisfies CallbackRequestPayload;

          onRequest?.(callbackRequestPayload);

          await beforeFetch?.(callbackRequestPayload);

          let response;
          try {
            response = await resolver(args);
          } catch (err) {
            debug?.("Error in resolver for %s %s: %O", method, url, err);
            throw err;
          }

          await afterFetch?.({
            ...callbackRequestPayload,
            response,
          });

          return response;
        };

        return [method, url, wrappedResolver];
      }) as MockFetchType;

      debug?.("Calling original mockFetch with wrapped routes");

      return originalMockFetch(wrappedRoutes, ...args.slice(1) as any);
    }

    debug?.("Routes is not an array, calling original mockFetch directly");

    return originalMockFetch(...args);
  }) as MockFetchFn;
}

import type { MockFetchFn } from "@luxass/msw-utils";
import type { ConfiguredResponse } from "./types";
import { CONFIGURED_RESPONSE } from "./helpers";

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
    && CONFIGURED_RESPONSE in (value as object);
}

export function extractConfiguredMetadata(response: unknown): {
  actualResponse: unknown;
  latency?: number | "random";
  headers?: Record<string, string>;
} {
  if (isConfiguredResponse(response)) {
    const meta = (response as any)[CONFIGURED_RESPONSE] as {
      latency?: number | "random";
      headers?: Record<string, string>;
    };

    return { actualResponse: response, latency: meta.latency, headers: meta.headers };
  }

  return { actualResponse: response };
}

export function wrapMockFetchWithConfig(
  originalMockFetch: MockFetchFn,
  latency?: number | "random",
  headers?: Record<string, string>,
): MockFetchFn {
  if (!latency && !headers) {
    // no configuration, return original
    return originalMockFetch;
  }

  return ((...args: Parameters<MockFetchFn>) => {
    const routes = args[0];

    // If routes is an array of tuples, wrap the resolvers
    if (Array.isArray(routes)) {
      const wrappedRoutes = routes.map((route) => {
        if (!Array.isArray(route) || route.length < 3) {
          return route;
        }

        const [method, url, resolver] = route;

        // only wrap if resolver is a function
        if (typeof resolver !== "function") {
          return route;
        }

        const wrappedResolver = async (...resolverArgs: any[]): Promise<any> => {
          // apply latency before calling resolver
          if (latency) {
            const ms = parseLatency(latency);
            await new Promise((resolve) => setTimeout(resolve, ms));
          }

          // call original resolver
          // @ts-expect-error - hmmm, fix later.
          const response = await resolver(...resolverArgs);

          // apply custom headers to response
          if (headers != null && (response as any)?.headers instanceof Headers) {
            for (const [key, value] of Object.entries(headers)) {
              (response as any).headers.set(key, value);
            }
          }

          return response;
        };

        return [method, url, wrappedResolver];
      });

      return originalMockFetch(wrappedRoutes as any, ...args.slice(1) as any);
    }

    return originalMockFetch(...args);
  }) as MockFetchFn;
}

export function wrapMockFetch(
  originalMockFetch: MockFetchFn,
  opts: {
    beforeFetch: (args: Parameters<MockFetchFn>) => Promise<void> | void;
    afterFetch: (response: Response) => Promise<void> | void;
  },
): MockFetchFn {
  const { beforeFetch, afterFetch } = opts;
  if (!beforeFetch && !afterFetch) {
    // no configuration, return original
    return originalMockFetch;
  }

  return ((...args: Parameters<MockFetchFn>) => {
    const routes = args[0];

    // If routes is an array of tuples, wrap the resolvers
    if (Array.isArray(routes)) {
      const wrappedRoutes = routes.map((route) => {
        if (!Array.isArray(route) || route.length < 3) {
          return route;
        }

        const [method, url, resolver] = route;

        // only wrap if resolver is a function
        if (typeof resolver !== "function") {
          return route;
        }

        const wrappedResolver = async (...resolverArgs: any[]): Promise<any> => {
          await beforeFetch(args);

          // call original resolver
          // @ts-expect-error - hmmm, fix later.
          const response = await resolver(...resolverArgs);

          // @ts-expect-error - hmmm, fix later.
          await afterFetch(response);

          return response;
        };

        return [method, url, wrappedResolver];
      });

      return originalMockFetch(wrappedRoutes as any, ...args.slice(1) as any);
    }

    return originalMockFetch(...args);
  }) as MockFetchFn;
}

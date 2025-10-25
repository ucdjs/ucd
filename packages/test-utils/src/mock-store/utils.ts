import type { MockFetchFn } from "@luxass/msw-utils";

export const CONFIGURED_RESPONSE: unique symbol = Symbol.for("__ucdjs_test_utils_configured__");

interface ConfiguredResponseConfig<Response> {
  response: Response;
  latency?: number | "random";
  headers?: Record<string, string>;
}

export type ConfiguredResponse<Response> = Response & {
  [CONFIGURED_RESPONSE]: {
    latency?: number | "random";
    headers?: Record<string, string>;
  };
};

export function configure<const Response>(
  config: ConfiguredResponseConfig<Response>,
): ConfiguredResponse<Response> {
  if (!config || typeof config !== "object" || !("response" in config)) {
    throw new Error("Invalid configure() call: missing response property");
  }

  if (
    typeof config.response !== "function" && typeof config.response !== "object" && config.response != null
  ) {
    throw new TypeError("Invalid configure() call: response must be a function or an object");
  }

  (config.response as any)[CONFIGURED_RESPONSE] = {
    latency: config.latency,
    headers: config.headers,
  };
  return config.response as any;
}

export function parseLatency(latency: number | "random"): number {
  if (latency === "random") {
    // Random latency between 100ms and 1000ms
    return Math.floor(Math.random() * 900) + 100;
  }
  return latency;
}

export function isConfiguredResponse(value: unknown): value is ConfiguredResponse<any> {
  return typeof value === "object" && value !== null && CONFIGURED_RESPONSE in value;
}

export function extractConfigMetadata(response: unknown): {
  actualResponse: unknown;
  latency?: number | "random";
  headers?: Record<string, string>;
} {
  if (isConfiguredResponse(response)) {
    const { [CONFIGURED_RESPONSE]: config, ...actualResponse } = response;
    return {
      actualResponse,
      latency: config.latency,
      headers: config.headers,
    };
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
          if (headers != null) {
            Object.entries(headers).forEach(([key, value]) => {
              ((response as any).headers as Headers).set(key, value);
            });
          }

          return response;
        };

        return [method, url, wrappedResolver];
      });

      return originalMockFetch(wrappedRoutes as any);
    }

    return originalMockFetch(...args);
  }) as MockFetchFn;
}

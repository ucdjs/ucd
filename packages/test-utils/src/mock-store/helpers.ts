import type { ConfiguredResponse, ConfiguredResponseConfig } from "./types";

/**
 * Bypass type checking for testing edge cases and invalid responses.
 * This is useful for testing error handling with responses that don't match the schema.
 *
 * @template {any} T - The type of the response being passed through
 * @param {T} response - Any response data to return without type checking
 * @returns {any} The response cast to `any` to bypass TypeScript type checking
 *
 * @example
 * ```ts
 * // Test with invalid schema
 * mockStoreApi({
 *   responses: {
 *     "/api/v1/versions": unsafeResponse({ invalid: "data" })
 *   }
 * });
 *
 * // Test with wrong type
 * mockStoreApi({
 *   responses: {
 *     "/api/v1/versions": unsafeResponse("not-an-array")
 *   }
 * });
 * ```
 */
export function unsafeResponse<T = any>(response: T): any {
  return response as any;
}

export const kConfiguredResponse: symbol = Symbol.for("ucdjs:test-utils:mock-store:configured-response");

/**
 * Configures a response with optional latency and headers for mocking purposes.
 * This allows simulating network conditions or custom response metadata in tests.
 *
 * The configuration is stored as a non-enumerable symbol property on the response object,
 * ensuring it doesn't interfere with serialization or iteration.
 *
 * @template Response - The type of the response being configured
 * @param config - The configuration object containing the response and optional settings
 * @returns The configured response with metadata attached as a symbol property
 * @throws {Error} If the config is invalid or missing required properties
 * @throws {TypeError} If the response is not a function or non-null object
 *
 * @example
 * ```ts
 * // Configure with latency
 * mockStoreApi({
 *   responses: {
 *     "/api/v1/versions": configure({
 *       response: [...],
 *       latency: 200
 *     })
 *   }
 * });
 *
 * // Configure with custom headers
 * mockStoreApi({
 *   responses: {
 *     "/api/v1/versions": configure({
 *       response: [...],
 *       headers: { "X-Custom-Header": "value" }
 *     })
 *   }
 * });
 *
 * // Combine with unsafeResponse for testing
 * mockStoreApi({
 *   responses: {
 *     "/api/v1/versions": configure({
 *       response: unsafeResponse({ invalid: "data" }),
 *       latency: "random"
 *     })
 *   }
 * });
 * ```
 */
export function configure<const Response>(
  config: ConfiguredResponseConfig<Response>,
): ConfiguredResponse<Response> {
  if (!config || typeof config !== "object" || !("response" in config)) {
    throw new Error("Invalid configure() call: missing response property");
  }

  if (
    config.response == null
    || (typeof config.response !== "function" && typeof config.response !== "object")
  ) {
    throw new TypeError(
      "Invalid configure() call: response must be a function or a non-null object",
    );
  }

  Object.defineProperty(config.response as object, kConfiguredResponse, {
    value: { latency: config.latency, headers: config.headers },
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return config.response as ConfiguredResponse<Response>;
}

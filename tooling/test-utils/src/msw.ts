import type { HttpResponseResolver } from "msw";
import type { HTTPMethod, NonEmptyArray } from "./types";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const MSW_SERVER = setupServer();

function createHandlersFromMethods(methods: readonly HTTPMethod[], url: string, resolver: HttpResponseResolver) {
  return methods.map((method) => {
    // For HEAD requests, execute the resolver and return response without body
    if (method === "HEAD") {
      return createHeadHandler(url, resolver);
    }
    return http[method.toLowerCase() as Lowercase<HTTPMethod>](url, resolver);
  });
}

function createHeadHandler(url: string, resolver: HttpResponseResolver) {
  return http.head(url, async (info) => {
    const response = await resolver(info);

    if (!response) {
      return new HttpResponse(null, { status: 200 });
    }

    if ("type" in response && response.type === "error") {
      return HttpResponse.error();
    }

    if (response instanceof HttpResponse || response instanceof Response) {
      return new HttpResponse(null, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return new HttpResponse(null, { status: 200 });
  });
}

export function mockFetch(
  methods: NonEmptyArray<HTTPMethod> | HTTPMethod,
  url: string,
  resolver: HttpResponseResolver,
): void;
export function mockFetch(
  endpoints: [NonEmptyArray<HTTPMethod> | HTTPMethod, string, HttpResponseResolver][],
): void;
export function mockFetch(
  methodsOrEndpoints: NonEmptyArray<HTTPMethod> | HTTPMethod | [NonEmptyArray<HTTPMethod> | HTTPMethod, string, HttpResponseResolver][],
  url?: string,
  resolver?: HttpResponseResolver,
): void {
  if (Array.isArray(methodsOrEndpoints) && methodsOrEndpoints.length > 0 && Array.isArray(methodsOrEndpoints[0])) {
    // handle batch registration
    const endpoints = methodsOrEndpoints as [NonEmptyArray<HTTPMethod> | HTTPMethod, string, HttpResponseResolver][];
    const handlers = endpoints.flatMap(([methods, endpointUrl, handlerResolver]) => {
      const methodArray = Array.isArray(methods) ? methods : [methods];
      return createHandlersFromMethods(methodArray, endpointUrl, handlerResolver);
    });

    MSW_SERVER.use(...handlers);
    return;
  } else if (url && resolver) {
    // handle single registration
    const methods = methodsOrEndpoints as NonEmptyArray<HTTPMethod> | HTTPMethod;
    const methodArray = Array.isArray(methods) ? methods : [methods];
    const handlers = createHandlersFromMethods(methodArray, url, resolver);

    MSW_SERVER.use(...handlers);
    return;
  }

  throw new Error("invalid arguments for mockFetch");
}

type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

/**
 * Enhanced mockFetch utility for MSW that supports multiple HTTP methods.
 *
 * Features:
 * - Single method: 'GET'
 * - Multiple methods: ['GET', 'POST', 'PATCH'] (array of methods)
 * - Batch registration with array of endpoints
 *
 * @example
 * ```typescript
 * import { mockFetch, mockResponses } from './msw';
 *
 * // Single method
 * mockFetch('GET', '/api/users', () => mockResponses.ok({ users: [] }));
 *
 * // Multiple methods - CRUD operations
 * mockFetch(['GET', 'POST', 'PATCH', 'DELETE'], '/api/users', () => mockResponses.ok({ success: true }));
 *
 * // File operations with HEAD check
 * mockFetch(['GET', 'HEAD'], '/api/files/data.txt', () => mockResponses.text('file content'));
 *
 * // Batch registration
 * mockFetch([
 *   [['GET', 'POST', 'PATCH'], '/api/users', () => mockResponses.ok({ users: [] })],
 *   [['GET', 'HEAD'], '/api/files/file1.txt', () => mockResponses.text('content1')],
 *   ['DELETE', '/api/users/123', () => mockResponses.empty()],
 * ]);
 * ```
 */
export const mockResponses = {
  /**
   * Returns a 400 Bad Request response with JSON body
   *
   * @param body - The error response body (defaults to generic error message)
   * @returns HttpResponse with status 400
   *
   * @example
   * ```typescript
   * mockResponses.badRequest({ error: 'Invalid email format' })
   * mockResponses.badRequest() // Returns { error: "Bad request" }
   * ```
   */
  badRequest: (body?: JsonBody) =>
    HttpResponse.json(body || { error: "Bad request" }, { status: 400 }),

  /**
   * Returns a 404 Not Found response with JSON body
   *
   * @param body - The error response body (defaults to generic error message)
   * @returns HttpResponse with status 404
   *
   * @example
   * ```typescript
   * mockResponses.notFound({ error: 'User not found' })
   * mockResponses.notFound() // Returns { error: "Not found" }
   * ```
   */
  notFound: (body?: JsonBody) =>
    HttpResponse.json(body || { error: "Not found" }, { status: 404 }),

  /**
   * Returns a 429 Too Many Requests response with JSON body
   *
   * @param body - The error response body (defaults to generic error message)
   * @returns HttpResponse with status 429
   *
   * @example
   * ```typescript
   * mockResponses.tooManyRequests({ error: 'Rate limit exceeded', retryAfter: 60 })
   * mockResponses.tooManyRequests() // Returns { error: "Too many requests" }
   * ```
   */
  tooManyRequests: (body?: JsonBody) =>
    HttpResponse.json(body || { error: "Too many requests" }, { status: 429 }),

  /**
   * Returns a 500 Internal Server Error response with JSON body
   *
   * @param body - The error response body (defaults to generic error message)
   * @returns HttpResponse with status 500
   *
   * @example
   * ```typescript
   * mockResponses.serverError({ error: 'Database connection failed' })
   * mockResponses.serverError() // Returns { error: "Internal server error" }
   * ```
   */
  serverError: (body?: JsonBody) =>
    HttpResponse.json(body || { error: "Internal server error" }, { status: 500 }),

  /**
   * Returns an empty response (no body)
   *
   * @param status - The HTTP status code (defaults to 204)
   * @returns HttpResponse with no content
   *
   * @example
   * ```typescript
   * mockResponses.empty() // 204 No Content
   * mockResponses.empty(200) // 200 OK with no body
   * ```
   */
  empty: (status: number = 204) => new HttpResponse(null, { status }),

  /**
   * Returns a HEAD response with custom headers
   *
   * @param headers - Headers to include in the response
   * @returns HttpResponse with status 200 and no body
   *
   * @example
   * ```typescript
   * mockResponses.head(new Headers({ 'content-length': '1024' }))
   * mockResponses.head() // Empty headers
   * ```
   */
  head: (headers: HeadersInit = {}) =>
    new HttpResponse(null, { status: 200, headers }),

  redirect: (url: string, status: number = 302) => {
    return new HttpResponse(null, {
      status,
      headers: {
        "Location": url,
        "Content-Type": "text/plain",
      },
    });
  },
};

export { http, HttpResponse, type NonEmptyArray };

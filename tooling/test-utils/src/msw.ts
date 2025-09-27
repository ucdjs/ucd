import type { NonEmptyArray } from "./types";
import { createMockFetch } from "@luxass/msw-utils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const MSW_SERVER = setupServer();

export const mockFetch = createMockFetch({
  mswServer: MSW_SERVER,
});

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

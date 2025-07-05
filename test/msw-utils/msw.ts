import { http, type HttpResponseResolver, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const MSW_SERVER = setupServer();

type Method = "get" | "post" | "put" | "delete" | "patch" | "head" | "options";
type MethodUpper = Uppercase<Method>;

function normalizeMethod(method: string): Method {
  return method.toLowerCase() as Method;
}

function parseEndpoint(pattern: `${MethodUpper} ${string}` | `${MethodUpper},${MethodUpper} ${string}` | `${MethodUpper}, ${MethodUpper} ${string}`): [Method[], string] {
  const [methodStr, ...urlParts] = pattern.split(" ");
  const url = urlParts.join(" ");

  // Handle comma-separated methods like "GET,HEAD /api/files"
  if (methodStr?.includes(",")) {
    const methods = methodStr.split(",").map(m => normalizeMethod(m.trim()));
    return [methods, url];
  }

  const method = normalizeMethod(methodStr as string);
  return [[method], url];
}

export function mockFetch(
  urlPattern: `${MethodUpper} ${string}` | `${MethodUpper},${MethodUpper} ${string}` | `${MethodUpper}, ${MethodUpper} ${string}`,
  resolver: HttpResponseResolver,
): void;
export function mockFetch(
  endpoints: [`${MethodUpper} ${string}` | `${MethodUpper},${MethodUpper} ${string}` | `${MethodUpper}, ${MethodUpper} ${string}`, HttpResponseResolver][],
): void;
export function mockFetch(
  urlOrList:
    | `${MethodUpper} ${string}`
    | `${MethodUpper},${MethodUpper} ${string}`
    | `${MethodUpper}, ${MethodUpper} ${string}`
    | [`${MethodUpper} ${string}` | `${MethodUpper},${MethodUpper} ${string}` | `${MethodUpper}, ${MethodUpper} ${string}`, HttpResponseResolver][],
  resolver?: HttpResponseResolver,
): void {
  if (Array.isArray(urlOrList)) {
    const handlers = urlOrList.flatMap(([pattern, handlerResolver]) => {
      const [methods, url] = parseEndpoint(pattern);
      return methods.map(method => {
        // For HEAD requests, execute the resolver and return response without body
        if (method === "head") {
          return http[method](url, async (info) => {
            const response = await handlerResolver(info);

            if (!response) {
              return new HttpResponse(null, { status: 200 });
            }

            if ("type" in response && response.type === "error") {
              return HttpResponse.error();
            }

            return new HttpResponse(null, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });
          });
        }
        return http[method](url, handlerResolver);
      });
    });
    MSW_SERVER.use(...handlers);
    return;
  } else if (typeof urlOrList === "string" && resolver) {
    const [methods, url] = parseEndpoint(urlOrList);
    const handlers = methods.map(method => {
      // For HEAD requests, execute the resolver and return response without body
      if (method === "head") {
        return http[method](url, async (info) => {
          const response = await resolver(info);

          if (!response) {
            return new HttpResponse(null, { status: 200 });
          }

          if ("type" in response && response.type === "error") {
            return HttpResponse.error();
          }

          return new HttpResponse(null, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        });
      }
      return http[method](url, resolver);
    });
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
 * - Single method: 'GET /api/users'
 * - Multiple methods: 'GET,HEAD /api/files' (automatically handles HEAD requests)
 * - Batch registration with array of endpoints
 *
 * @example
 * ```typescript
 * import { mockFetch, mockResponses } from './msw';
 *
 * // Single method
 * mockFetch('GET /api/users', () => mockResponses.ok({ users: [] }));
 *
 * // Multiple methods - useful for file operations that check existence with HEAD
 * mockFetch('GET,HEAD /api/files/data.txt', () => mockResponses.text('file content'));
 *
 * // Batch registration
 * mockFetch([
 *   ['GET,HEAD /api/files/file1.txt', () => mockResponses.text('content1')],
 *   ['GET /api/users', () => mockResponses.ok({ users: [] })],
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
        Location: url,
        "Content-Type": "text/plain",
      },
    });
  },
};

export { http, HttpResponse };

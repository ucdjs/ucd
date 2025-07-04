import { http, type HttpResponseResolver, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const MSW_SERVER = setupServer();

type Method = "get" | "post" | "put" | "delete" | "patch" | "head" | "options";
type MethodUpper = Uppercase<Method>;

function normalizeMethod(method: string): Method {
  return method.toLowerCase() as Method;
}

function parseEndpoint(pattern: `${MethodUpper} ${string}`): [Method, string] {
  const [methodStr, ...urlParts] = pattern.split(" ");
  const method = normalizeMethod(methodStr as string);
  const url = urlParts.join(" ");
  return [method, url];
}

export function mockFetch(
  urlPattern: `${MethodUpper} ${string}`,
  resolver: HttpResponseResolver<any, any, undefined>,
): void;
export function mockFetch(
  endpoints: [`${MethodUpper} ${string}`, HttpResponseResolver<any, any, undefined>][],
): void;
export function mockFetch(
  urlOrList:
    | `${MethodUpper} ${string}`
    | [`${MethodUpper} ${string}`, HttpResponseResolver<any, any, undefined>][],
  resolver?: HttpResponseResolver,
): void {
  if (Array.isArray(urlOrList)) {
    const handlers = urlOrList.map(([pattern, handlerResolver]) => {
      const [method, url] = parseEndpoint(pattern);
      return http[method](url, handlerResolver);
    });
    MSW_SERVER.use(...handlers);
    return;
  } else if (typeof urlOrList === "string" && resolver) {
    const [method, url] = parseEndpoint(urlOrList);
    MSW_SERVER.use(http[method](url, resolver));
    return;
  }

  throw new Error("invalid arguments for mockFetch");
}

type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

/**
 * Pre-configured HTTP response utilities for MSW mocking
 *
 * @example
 * ```typescript
 * import { mockFetch, mockResponses } from './msw';
 *
 * // Mock a successful API response
 * mockFetch('GET /api/users', () => mockResponses.ok({ users: [] }));
 *
 * // Mock an error response
 * mockFetch('POST /api/users', () => mockResponses.badRequest({ error: 'Invalid data' }));
 * ```
 */
export const mockResponses = {
  /**
   * Returns a successful 200 response with JSON body
   *
   * @param body - The response body (defaults to empty object)
   * @returns HttpResponse with status 200
   *
   * @example
   * ```typescript
   * mockResponses.ok({ id: 1, name: 'John' })
   * mockResponses.ok() // Returns {}
   * ```
   */
  ok: <T extends JsonBody>(body: T = {} as T) => HttpResponse.json(body, { status: 200 }),

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
   * Returns a JSON response with custom status code
   *
   * @param body - The response body
   * @param status - The HTTP status code (defaults to 200)
   * @returns HttpResponse with custom status
   *
   * @example
   * ```typescript
   * mockResponses.json({ message: 'Created' }, 201)
   * mockResponses.json({ users: [] }) // Defaults to 200
   * ```
   */
  json: <T extends JsonBody>(body: T, status: number = 200) =>
    HttpResponse.json(body, { status }),

  /**
   * Returns a plain text response
   *
   * @param body - The text content
   * @param status - The HTTP status code (defaults to 200)
   * @returns HttpResponse with text/plain content-type
   *
   * @example
   * ```typescript
   * mockResponses.text('Hello World')
   * mockResponses.text('Error occurred', 500)
   * ```
   */
  text: (body: string, status: number = 200) =>
    new HttpResponse(body, {
      status,
      headers: { "Content-Type": "text/plain" },
    }),

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

  timeout: (message: string = "Request timed out") => {
    return new HttpResponse(message, {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  },

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

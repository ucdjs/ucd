import type { ApiError } from "./schemas";

export interface ResponseOptions {
  /**
   * The message to include in the response.
   */
  message?: string;

  /**
   * The path of the request that resulted in the error.
   */
  path?: string;

  /**
   * Additional headers to include in the response.
   * This can be used to set custom headers like `Content-Type`, `Cache-Control`,
   * or any other headers that might be relevant to the response.
   */
  headers?: Record<string, string>;
}

export function notFound(options: ResponseOptions = {}): Response {
  return Response.json({
    path: options.path || "unknown",
    message: options.message || "Not found",
    status: 404,
    timestamp: new Date().toISOString(),
  } satisfies ApiError, {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export function forbidden(options: ResponseOptions = {}): Response {
  return Response.json({
    path: options.path || "unknown",
    message: options.message || "Not found",
    status: 403,
    timestamp: new Date().toISOString(),
  } satisfies ApiError, {
    status: 403,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export function internalServerError(options: ResponseOptions = {}): Response {
  return Response.json({
    path: options.path || "unknown",
    message: options.message || "Internal server error",
    status: 500,
    timestamp: new Date().toISOString(),
  } satisfies ApiError, {
    status: 500,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

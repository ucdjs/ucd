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

/**
 * Creates a standardized 400 Bad Request HTTP response with JSON error details.
 *
 * @param {ResponseOptions?} options - Configuration options for the response
 * @returns {Response} A Response object with 400 status and JSON error body
 *
 * @example
 * ```typescript
 * import { badRequest } from "@ucdjs/worker-shared";
 *
 * // Basic usage
 * return badRequest();
 *
 * // With custom message and path
 * return badRequest({
 *   message: "Invalid request parameters",
 *   path: "/api/users"
 * });
 * ```
 */
export function badRequest(options: ResponseOptions = {}): Response {
  return Response.json({
    path: options.path || "unknown",
    message: options.message || "Bad request",
    status: 400,
    timestamp: new Date().toISOString(),
  } satisfies ApiError, {
    status: 400,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/**
 * Creates a standardized 403 Forbidden HTTP response with JSON error details.
 *
 * @param {ResponseOptions?} options - Configuration options for the response
 * @returns {Response} A Response object with 403 status and JSON error body
 *
 * @example
 * ```typescript
 * import { forbidden } from "@ucdjs/worker-shared";
 *
 * // Basic usage
 * return forbidden();
 *
 * // With custom message and path
 * return forbidden({
 *   message: "Access denied to this resource",
 *   path: "/api/admin/users"
 * });
 * ```
 */
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

/**
 * Creates a standardized 404 Not Found HTTP response with JSON error details.
 *
 * @param {ResponseOptions?} options - Configuration options for the response
 * @returns {Response} A Response object with 404 status and JSON error body
 *
 * @example
 * ```typescript
 * import { notFound } from "@ucdjs/worker-shared";
 *
 * // Basic usage
 * return notFound();
 *
 * // With custom message and path
 * return notFound({
 *   message: "User not found",
 *   path: "/api/users/123"
 * });
 * ```
 */
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

/**
 * Creates a standardized 500 Internal Server Error HTTP response with JSON error details.
 *
 * @param {ResponseOptions?} options - Configuration options for the response
 * @returns {Response} A Response object with 500 status and JSON error body
 *
 * @example
 * ```typescript
 * import { internalServerError } from "@ucdjs/worker-shared";
 *
 * // Basic usage
 * return internalServerError();
 *
 * // With custom message and path
 * return internalServerError({
 *   message: "Database connection failed",
 *   path: "/api/users"
 * });
 * ```
 */
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

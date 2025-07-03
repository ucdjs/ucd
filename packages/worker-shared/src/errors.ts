import type { Context } from "hono";
import type { TypedResponse } from "hono/types";
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
 * @param {Context | ResponseOptions} contextOrOptions - Hono context or configuration options
 * @param {Omit<ResponseOptions, 'path'>?} options - Configuration options when context is provided
 * @returns {Response} A Response object with 400 status and JSON error body
 *
 * @example
 * ```typescript
 * import { badRequest } from "@ucdjs/worker-shared";
 *
 * // Basic usage (legacy)
 * return badRequest();
 *
 * // With custom message and path (legacy)
 * return badRequest({
 *   message: "Invalid request parameters",
 *   path: "/api/users"
 * });
 *
 * // With Hono context (new)
 * return badRequest(c, { message: "Invalid request parameters" });
 * ```
 */
export function badRequest(contextOrOptions: Context | ResponseOptions = {}, options: Omit<ResponseOptions, "path"> = {}): Response & TypedResponse<ApiError, 400, "json"> {
  let finalOptions: ResponseOptions;

  if ("req" in contextOrOptions) {
    // It's a Hono context
    const url = new URL(contextOrOptions.req.url);
    finalOptions = {
      path: url.pathname,
      ...options,
    };
  } else {
    // It's options (legacy usage)
    finalOptions = contextOrOptions;
  }

  return Response.json({
    path: finalOptions.path || "unknown",
    message: finalOptions.message || "Bad request",
    status: 400,
    timestamp: new Date().toISOString(),
  } satisfies ApiError, {
    status: 400,
    headers: {
      "Content-Type": "application/json",
      ...finalOptions.headers,
    },
  }) as any;
}

/**
 * Creates a standardized 403 Forbidden HTTP response with JSON error details.
 *
 * @param {Context | ResponseOptions} contextOrOptions - Hono context or configuration options
 * @param {Omit<ResponseOptions, 'path'>?} options - Configuration options when context is provided
 * @returns {Response} A Response object with 403 status and JSON error body
 *
 * @example
 * ```typescript
 * import { forbidden } from "@ucdjs/worker-shared";
 *
 * // Basic usage (legacy)
 * return forbidden();
 *
 * // With custom message and path (legacy)
 * return forbidden({
 *   message: "Access denied to this resource",
 *   path: "/api/admin/users"
 * });
 *
 * // With Hono context (new)
 * return forbidden(c, { message: "Access denied to this resource" });
 * ```
 */
export function forbidden(contextOrOptions: Context | ResponseOptions = {}, options: Omit<ResponseOptions, "path"> = {}): Response & TypedResponse<ApiError, 403, "json"> {
  let finalOptions: ResponseOptions;

  if ("req" in contextOrOptions) {
    // It's a Hono context
    const url = new URL(contextOrOptions.req.url);
    finalOptions = {
      path: url.pathname,
      ...options,
    };
  } else {
    // It's options (legacy usage)
    finalOptions = contextOrOptions;
  }

  return Response.json({
    path: finalOptions.path || "unknown",
    message: finalOptions.message || "Forbidden",
    status: 403,
    timestamp: new Date().toISOString(),
  } satisfies ApiError, {
    status: 403,
    headers: {
      "Content-Type": "application/json",
      ...finalOptions.headers,
    },
  }) as any;
}

/**
 * Creates a standardized 404 Not Found HTTP response with JSON error details.
 *
 * @param {Context | ResponseOptions} contextOrOptions - Hono context or configuration options
 * @param {Omit<ResponseOptions, 'path'>?} options - Configuration options when context is provided
 * @returns {Response} A Response object with 404 status and JSON error body
 *
 * @example
 * ```typescript
 * import { notFound } from "@ucdjs/worker-shared";
 *
 * // Basic usage (legacy)
 * return notFound();
 *
 * // With custom message and path (legacy)
 * return notFound({
 *   message: "User not found",
 *   path: "/api/users/123"
 * });
 *
 * // With Hono context (new)
 * return notFound(c, { message: "User not found" });
 * ```
 */
export function notFound(contextOrOptions: Context | ResponseOptions = {}, options: Omit<ResponseOptions, "path"> = {}): Response & TypedResponse<ApiError, 404, "json"> {
  let finalOptions: ResponseOptions;

  if ("req" in contextOrOptions) {
    // It's a Hono context
    const url = new URL(contextOrOptions.req.url);
    finalOptions = {
      path: url.pathname,
      ...options,
    };
  } else {
    // It's options (legacy usage)
    finalOptions = contextOrOptions;
  }

  return Response.json({
    path: finalOptions.path || "unknown",
    message: finalOptions.message || "Not found",
    status: 404,
    timestamp: new Date().toISOString(),
  } satisfies ApiError, {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      ...finalOptions.headers,
    },
  }) as any;
}

/**
 * Creates a standardized 500 Internal Server Error HTTP response with JSON error details.
 *
 * @param {Context | ResponseOptions} contextOrOptions - Hono context or configuration options
 * @param {Omit<ResponseOptions, 'path'>?} options - Configuration options when context is provided
 * @returns {Response} A Response object with 500 status and JSON error body
 *
 * @example
 * ```typescript
 * import { internalServerError } from "@ucdjs/worker-shared";
 *
 * // Basic usage (legacy)
 * return internalServerError();
 *
 * // With custom message and path (legacy)
 * return internalServerError({
 *   message: "Database connection failed",
 *   path: "/api/users"
 * });
 *
 * // With Hono context (new)
 * return internalServerError(c, { message: "Database connection failed" });
 * ```
 */
export function internalServerError(contextOrOptions: Context | ResponseOptions = {}, options: Omit<ResponseOptions, "path"> = {}): Response & TypedResponse<ApiError, 500, "json"> {
  let finalOptions: ResponseOptions;

  if ("req" in contextOrOptions) {
    // It's a Hono context
    const url = new URL(contextOrOptions.req.url);
    finalOptions = {
      path: url.pathname,
      ...options,
    };
  } else {
    // It's options (legacy usage)
    finalOptions = contextOrOptions;
  }

  return Response.json({
    path: finalOptions.path || "unknown",
    message: finalOptions.message || "Internal server error",
    status: 500,
    timestamp: new Date().toISOString(),
  } satisfies ApiError, {
    status: 500,
    headers: {
      "Content-Type": "application/json",
      ...finalOptions.headers,
    },
  }) as any;
}

export type CustomResponseOptions = Omit<Required<ResponseOptions>, "headers"> & {
  /**
   * Custom headers to include in the response.
   * This can be used to set headers like `Content-Type`, `Cache-Control`, etc.
   */
  headers?: Record<string, string>;

  /**
   * The HTTP status code to use for the response.
   * This should be a valid @see {ContentfulStatusCode}.
   */
  status: number;
};

export type CustomResponseOptionsWithContext = Omit<CustomResponseOptions, "path"> & {
  /**
   * Custom headers to include in the response.
   * This can be used to set headers like `Content-Type`, `Cache-Control`, etc.
   */
  headers?: Record<string, string>;

  /**
   * The HTTP status code to use for the response.
   * This should be a valid @see {ContentfulStatusCode}.
   */
  status: number;
};

/**
 * Creates a custom HTTP error response with specified status code and JSON error details.
 * This function allows for flexible error responses with any valid HTTP status code.
 *
 * @param {Context | CustomResponseOptions} contextOrOptions - Hono context or configuration options
 * @param {CustomResponseOptionsWithContext?} options - Configuration options when context is provided
 * @returns {Response} A Response object with the specified status and JSON error body
 *
 * @example
 * ```typescript
 * import { customError } from "@ucdjs/worker-shared";
 *
 * // Custom 422 Unprocessable Entity error (legacy)
 * return customError({
 *   status: 422,
 *   message: "Validation failed",
 *   path: "/api/users"
 * });
 *
 * // Custom 429 Too Many Requests error with headers (legacy)
 * return customError({
 *   status: 429,
 *   message: "Rate limit exceeded",
 *   path: "/api/data",
 *   headers: {
 *     "Retry-After": "3600"
 *   }
 * });
 *
 * // With Hono context (new)
 * return customError(c, {
 *   status: 422,
 *   message: "Validation failed"
 * });
 * ```
 */
export function customError(contextOrOptions: Context | CustomResponseOptions, options?: CustomResponseOptionsWithContext): Response {
  let finalOptions: CustomResponseOptions;

  if ("req" in contextOrOptions) {
    // It's a Hono context
    if (!options) {
      throw new Error("Options parameter is required when using Hono context");
    }
    const url = new URL(contextOrOptions.req.url);
    finalOptions = {
      path: url.pathname,
      ...options,
    };
  } else {
    // It's options (legacy usage)
    finalOptions = contextOrOptions;
  }

  return Response.json({
    path: finalOptions.path,
    message: finalOptions.message,
    status: finalOptions.status,
    timestamp: new Date().toISOString(),
  } satisfies ApiError, {
    status: finalOptions.status,
    headers: {
      "Content-Type": "application/json",
      ...finalOptions.headers,
    },
  });
}

import type { ApiError } from "@ucdjs/schemas";

/**
 * Type guard function that checks if an unknown value is an ApiError object.
 *
 * This function performs runtime type checking to determine if the provided value
 * conforms to the ApiError interface structure by verifying the presence of
 * required properties: message, status, and timestamp.
 *
 * @param {unknown} error - The unknown value to check against the ApiError type
 * @returns {error is ApiError} True if the value is an ApiError, false otherwise
 *
 * @example
 * ```typescript
 * import { isApiError } from "@ucdjs/client";
 * import { client } from "@ucdjs/client";
 *
 * const { error, data } = await client.GET("/api/v1/versions");
 * if (isApiError(error)) {
 *   console.error("API Error:", error.message);
 * }
 * ```
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object"
    && error !== null
    && "message" in error
    && "status" in error
    && "timestamp" in error
    && typeof (error as any).message === "string"
    && typeof (error as any).status === "number"
    && typeof (error as any).timestamp === "string"
  );
}

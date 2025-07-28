import type { ApiError } from "./components";

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
 * import { isApiError } from "@ucdjs/fetch";
 * import { client } from "@ucdjs/fetch";
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
  );
}

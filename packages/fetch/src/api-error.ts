import type { ApiError } from "./components";

/**
 * Custom error class for API response errors.
 * Extends the native Error class to provide additional context about API failures.
 */
export class ApiResponseError extends Error {
  #path: string;
  #status: number;
  #timestamp: string;

  /**
   * Creates a new ApiResponseError instance.
   * @param {ApiError} options - The error details from the API response
   */
  constructor({ message, path, status, timestamp }: ApiError) {
    super(message);
    this.name = "ApiResponseError";
    this.#path = path;
    this.#status = status;
    this.#timestamp = timestamp;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiResponseError);
    }
  }

  /**
   * The API endpoint path where the error occurred.
   */
  get path(): string {
    return this.#path;
  }

  /**
   * The HTTP status code of the failed response.
   */
  get status(): number {
    return this.#status;
  }

  /**
   * The timestamp when the error occurred.
   */
  get timestamp(): string {
    return this.#timestamp;
  }

  /**
   * Converts the error instance to a plain object representation.
   * @returns {ApiError} An object containing the error details
   */
  toJSON(): ApiError {
    return {
      path: this.path,
      message: this.message,
      status: this.status,
      timestamp: this.timestamp,
    };
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object"
    && error !== null
    && "path" in error
    && "message" in error
    && "status" in error
    && "timestamp" in error
  );
}

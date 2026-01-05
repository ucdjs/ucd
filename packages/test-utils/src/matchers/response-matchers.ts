import type { ApiError } from "@ucdjs/schemas";
import type { MatcherState, RawMatcherFn } from "@vitest/expect";
import { tryOr } from "@ucdjs-internal/shared";

export interface ApiErrorOptions {
  status: number;
  message?: string | RegExp;
}

export const toBeApiError: RawMatcherFn<MatcherState, [ApiErrorOptions]> = async function (
  this: MatcherState,
  received: Response,
  options: ApiErrorOptions,
) {
  const { isNot, equals } = this;

  if (!equals(received.status, options.status)) {
    return {
      pass: false,
      message: () => `Expected response to${isNot ? " not" : ""} be an API error with status ${options.status}, but got ${received.status}`,
    };
  }

  const contentType = received.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return {
      pass: false,
      message: () => `Expected response to${isNot ? " not" : ""} have application/json content-type`,
    };
  }

  const error = await received.json() as ApiError;

  if (!error.status || !error.message || !error.timestamp) {
    return {
      pass: false,
      message: () => `Expected response to${isNot ? " not" : ""} have status, message, and timestamp properties`,
    };
  }

  if (options.message) {
    const messageMatches = typeof options.message === "string"
      ? error.message === options.message
      : options.message.test(error.message);

    if (!messageMatches) {
      const expectedMsg = typeof options.message === "string"
        ? options.message
        : options.message.source;
      return {
        pass: false,
        message: () => `Expected error message to${isNot ? " not" : ""} match ${expectedMsg}, but got "${error.message}"`,
      };
    }
  }

  return {
    pass: true,
    message: () => `Expected response to${isNot ? " not" : ""} be an API error`,
  };
};

export interface HeadersOptions {
  headers?: Record<string, string | RegExp>;
  json?: boolean;
  cache?: boolean;
  cacheMaxAgePattern?: RegExp;
}

export const toBeHeadError: RawMatcherFn<MatcherState, [number]> = function (
  this: MatcherState,
  received: Response,
  expectedStatus: number,
) {
  const { isNot, equals } = this;

  if (!equals(received.status, expectedStatus)) {
    return {
      pass: false,
      message: () => `Expected HEAD response status to${isNot ? " not" : ""} be ${expectedStatus}, but got ${received.status}`,
    };
  }

  const contentLength = received.headers.get("content-length");
  if (contentLength !== null && Number.parseInt(contentLength, 10) !== 0) {
    return {
      pass: false,
      message: () => `Expected HEAD response to${isNot ? " not" : ""} have content-length of 0`,
    };
  }

  return {
    pass: true,
    message: () => `Expected HEAD response to${isNot ? " not" : ""} have status ${expectedStatus}`,
  };
};

export interface ResponseMatcherOptions {
  /**
   * Expected HTTP status code
   */
  status?: number;

  /**
   * Expected response headers (supports exact match or regex pattern)
   */
  headers?: Record<string, string | RegExp>;

  /**
   * Whether to verify application/json content-type
   */
  json?: boolean;

  /**
   * Whether to verify cache-control header exists
   */
  cache?: boolean;

  /**
   * Regex pattern to match against cache-control max-age value
   */
  cacheMaxAgePattern?: RegExp;

  /**
   * For API error responses, validate error structure and message.
   * When provided, ensures the response is JSON and contains status, message, and timestamp properties.
   */
  error?: {
    /**
     * Expected error message (string for exact match, RegExp for pattern)
     */
    message?: string | RegExp;
  };
}

export const toMatchResponse: RawMatcherFn<MatcherState, [ResponseMatcherOptions]> = async function (
  this: MatcherState,
  received: Response,
  options: ResponseMatcherOptions,
) {
  const { isNot, equals } = this;

  // Check status code
  if (options.status !== undefined && !equals(received.status, options.status)) {
    return {
      pass: false,
      message: () => `Expected status to${isNot ? " not" : ""} be ${options.status}, but got ${received.status}`,
    };
  }

  const contentType = received.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  // Check if content-type is JSON.
  if (options.json && !isJson) {
    return {
      pass: false,
      message: () => `Expected response to${isNot ? " not" : ""} have application/json content-type`,
    };
  }

  // Check cache headers if requested
  if (options.cache) {
    const cacheControl = received.headers.get("cache-control");
    if (!cacheControl) {
      return {
        pass: false,
        message: () => `Expected response to${isNot ? " not" : ""} have cache-control header`,
      };
    }

    if (options.cacheMaxAgePattern && !options.cacheMaxAgePattern.test(cacheControl)) {
      return {
        pass: false,
        message: () => `Expected cache-control to${isNot ? " not" : ""} match ${options.cacheMaxAgePattern!.source}`,
      };
    }

    if (!options.cacheMaxAgePattern && !/max-age=\d+/.test(cacheControl)) {
      return {
        pass: false,
        message: () => `Expected cache-control to${isNot ? " not" : ""} have max-age`,
      };
    }
  }

  // Check custom headers
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      const headerValue = received.headers.get(key);
      if (!headerValue) {
        return {
          pass: false,
          message: () => `Expected response to${isNot ? " not" : ""} have ${key} header`,
        };
      }

      const matches = typeof value === "string"
        ? equals(headerValue, value)
        : value.test(headerValue);

      if (!matches) {
        const expected = typeof value === "string" ? value : value.source;
        return {
          pass: false,
          message: () => `Expected ${key} header to${isNot ? " not" : ""} match ${expected}, but got "${headerValue}"`,
        };
      }
    }
  }

  // Check error structure and message if requested
  if (options.error) {
    if (!isJson) {
      return {
        pass: false,
        message: () => `Expected error response to${isNot ? " not" : ""} have application/json content-type`,
      };
    }

    const error = await tryOr({
      try: async () => received.json() as Promise<ApiError>,
      err(err) {
        console.error("Failed to parse response JSON:", err);
        return null;
      },
    });

    if (error == null) {
      return {
        pass: false,
        message: () => `Expected response body to${isNot ? " not" : ""} be valid JSON`,
      };
    }

    // Check required error properties
    if (!error.status) {
      return {
        pass: false,
        message: () => `Expected error to${isNot ? " not" : ""} have "status" property`,
      };
    }
    if (!error.message) {
      return {
        pass: false,
        message: () => `Expected error to${isNot ? " not" : ""} have "message" property`,
      };
    }
    if (!error.timestamp) {
      return {
        pass: false,
        message: () => `Expected error to${isNot ? " not" : ""} have "timestamp" property`,
      };
    }

    // Check that error status matches response status if both are provided
    if (options.status !== undefined && !equals(error.status, options.status)) {
      return {
        pass: false,
        message: () => `Expected error.status to${isNot ? " not" : ""} be ${options.status}, but got ${error.status}`,
      };
    }

    // Check error message if provided
    if (options.error.message) {
      const messageMatches = equals(error.message, options.error.message);

      if (!messageMatches) {
        const expectedMsg = typeof options.error.message === "string"
          ? options.error.message
          : options.error.message.source;
        return {
          pass: false,
          message: () => `Expected error.message to${isNot ? " not" : ""} match "${expectedMsg}", but got "${error.message}"`,
        };
      }
    }
  }

  return {
    pass: true,
    message: () => `Expected response to${isNot ? " not" : ""} match the given criteria`,
  };
};

import type { MatcherState, RawMatcherFn } from "@vitest/expect";

export interface ErrorMatcherOptions {
  /**
   * Expected error class constructor
   */
  type?: new (...args: any[]) => Error;

  /**
   * Expected error message (string for exact match, RegExp for pattern)
   */
  message?: string | RegExp;

  /**
   * Expected cause error type (supports both .cause and .originalError)
   */
  cause?: new (...args: any[]) => Error;

  /**
   * Expected fields/properties on the error object.
   * Each key-value pair will be checked against the error's properties.
   */
  fields?: Record<string, unknown>;
}

export const toMatchError: RawMatcherFn<MatcherState, [ErrorMatcherOptions]> = function (
  received: unknown,
  options: ErrorMatcherOptions,
) {
  let error: Error | null = null;

  // If received is a function, call it and catch the error
  if (typeof received === "function") {
    try {
      received();

      return {
        pass: false,
        message: () => "Expected function to throw an error, but it did not",
      };
    } catch (e: unknown) {
      if (!(e instanceof Error)) {
        return {
          pass: false,
          message: () => `Expected function to throw an Error, but it threw ${typeof e}`,
        };
      }

      error = e;
    }
  } else if (received instanceof Error) {
    error = received;
  } else {
    return {
      pass: false,
      message: () => `Expected an Error instance or a function that throws, but received ${typeof received}`,
    };
  }

  const errorName = error.constructor.name;

  // Check error type
  if (options.type && !(error instanceof options.type)) {
    return {
      pass: false,
      message: () =>
        `Expected error to be instance of ${options.type!.name}, but got ${errorName}`,
    };
  }

  // Check error message
  if (options.message) {
    const messageMatches = typeof options.message === "string"
      ? error.message === options.message
      : options.message.test(error.message);

    if (!messageMatches) {
      return {
        pass: false,
        message: () =>
          `Expected error message to match ${options.message}, but got "${error.message}"`,
      };
    }
  }

  // Check error cause (supports both .cause and .originalError)
  if (options.cause) {
    const causeError = (error as { cause?: unknown; originalError?: unknown }).cause
      ?? (error as { originalError?: unknown }).originalError;

    if (!causeError) {
      return {
        pass: false,
        message: () => `Expected error to have a cause, but none was found`,
      };
    }

    if (!(causeError instanceof options.cause)) {
      const causeName = causeError instanceof Error ? causeError.constructor.name : typeof causeError;
      return {
        pass: false,
        message: () =>
          `Expected cause to be instance of ${options.cause!.name}, but got ${causeName}`,
      };
    }
  }

  // Check error fields/properties
  if (options.fields) {
    const errorRecord = error as unknown as Record<string, unknown>;

    for (const [key, expectedValue] of Object.entries(options.fields)) {
      const actualValue = errorRecord[key];

      // Deep equality check for objects/arrays, strict equality for primitives
      const valuesMatch = typeof expectedValue === "object" && expectedValue !== null
        ? JSON.stringify(actualValue) === JSON.stringify(expectedValue)
        : actualValue === expectedValue;

      if (!valuesMatch) {
        return {
          pass: false,
          message: () =>
            `Expected error.${key} to be ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actualValue)}`,
        };
      }
    }
  }

  return {
    pass: true,
    message: () => `Expected error not to match the given criteria`,
  };
};

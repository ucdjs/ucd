import type { ApiError } from "@ucdjs/schemas";
import { assert, describe, expect, it } from "vitest";
import { isApiError } from "../src/guards";

describe("isApiError", () => {
  it("should return true for valid ApiError object", () => {
    const validApiError = {
      message: "Something went wrong",
      status: 500,
      timestamp: "2023-01-01T00:00:00Z",
    } satisfies ApiError;

    expect(isApiError(validApiError)).toBe(true);
  });

  it("should return true for object with additional properties", () => {
    const apiErrorWithExtra = {
      message: "Error occurred",
      status: 404,
      timestamp: "2023-01-01T00:00:00Z",
      details: "Additional details",
    };

    expect(isApiError(apiErrorWithExtra)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isApiError(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isApiError(undefined)).toBe(false);
  });

  it("should return false for primitive types", () => {
    expect(isApiError("string")).toBe(false);
    expect(isApiError(123)).toBe(false);
    expect(isApiError(true)).toBe(false);
    expect(isApiError(Symbol("test"))).toBe(false);
  });

  it("should return false for empty object", () => {
    expect(isApiError({})).toBe(false);
  });

  it("should return false for object missing message property", () => {
    const missingMessage = {
      status: 500,
      timestamp: "2023-01-01T00:00:00Z",
    };

    expect(isApiError(missingMessage)).toBe(false);
  });

  it("should return false for object missing status property", () => {
    const missingStatus = {
      message: "Error message",
      timestamp: "2023-01-01T00:00:00Z",
    };

    expect(isApiError(missingStatus)).toBe(false);
  });

  it("should return false for object missing timestamp property", () => {
    const missingTimestamp = {
      message: "Error message",
      status: 500,
    };

    expect(isApiError(missingTimestamp)).toBe(false);
  });

  it("should return false for array", () => {
    expect(isApiError([])).toBe(false);
    expect(isApiError(["message", "status", "timestamp"])).toBe(false);
  });

  it("should return true when used as type guard", () => {
    const unknownError: unknown = {
      message: "API Error",
      status: 400,
      timestamp: "2023-01-01T00:00:00Z",
    };

    expect(isApiError(unknownError)).toBe(true);
    assert(isApiError(unknownError));
    expect(unknownError.message).toBe("API Error");
    expect(unknownError.status).toBe(400);
    expect(unknownError.timestamp).toBe("2023-01-01T00:00:00Z");
  });
});

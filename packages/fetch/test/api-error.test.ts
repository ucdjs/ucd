import type { ApiError } from "../src/components";
import { assert, describe, expect, it } from "vitest";
import { ApiResponseError } from "../src/api-error";

describe("api response error handling", () => {
  const mockApiError: ApiError = {
    message: "Resource not found",
    status: 404,
    timestamp: "2023-12-01T10:00:00Z",
  };

  describe("constructor", () => {
    it("should create an instance with all properties", () => {
      const error = new ApiResponseError(mockApiError);

      expect(error).toBeInstanceOf(ApiResponseError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("ApiResponseError");
      expect(error.message).toBe(mockApiError.message);
      expect(error.status).toBe(mockApiError.status);
      expect(error.timestamp).toBe(mockApiError.timestamp);
    });

    it("should handle empty message", () => {
      const apiError: ApiError = {
        message: "",
        status: 500,
        timestamp: "2023-12-01T10:00:00Z",
      };

      const error = new ApiResponseError(apiError);
      expect(error.message).toBe("");
    });

    it.each([
      400,
      401,
      403,
      404,
      500,
      502,
      503,
    ])("should handle status code %d", (status) => {
      const apiError: ApiError = {
        message: `Error ${status}`,
        status,
        timestamp: "2023-12-01T10:00:00Z",
      };

      const error = new ApiResponseError(apiError);
      expect(error.status).toBe(status);
    });
  });

  describe("getter methods", () => {
    it("should return correct status", () => {
      const error = new ApiResponseError(mockApiError);
      expect(error.status).toBe(mockApiError.status);
    });

    it("should return correct timestamp", () => {
      const error = new ApiResponseError(mockApiError);
      expect(error.timestamp).toBe(mockApiError.timestamp);
    });

    it("should have immutable properties", () => {
      const error = new ApiResponseError(mockApiError);

      // these should not be writable
      expect(() => {
        // @ts-expect-error - Testing immutability
        error.status = 500;
      }).toThrow();

      expect(() => {
        // @ts-expect-error - Testing immutability
        error.timestamp = "new timestamp";
      }).toThrow();
    });
  });

  describe("toJSON", () => {
    it("should return correct JSON representation", () => {
      const error = new ApiResponseError(mockApiError);
      const json = error.toJSON();

      expect(json).toEqual(mockApiError);
      expect(json).toEqual({
        message: mockApiError.message,
        status: mockApiError.status,
        timestamp: mockApiError.timestamp,
      });
    });

    it("should return independent object", () => {
      const error = new ApiResponseError(mockApiError);
      const json = error.toJSON();

      // modifying the returned object should not affect the original error
      json.message = "Modified message";
      expect(error.message).toBe(mockApiError.message);
    });
  });

  describe("error inheritance", () => {
    it("should be instanceof Error", () => {
      const error = new ApiResponseError(mockApiError);
      expect(error).toBeInstanceOf(Error);
    });

    it("should be instanceof ApiResponseError", () => {
      const error = new ApiResponseError(mockApiError);
      expect(error).toBeInstanceOf(ApiResponseError);
    });

    it("should have correct name property", () => {
      const error = new ApiResponseError(mockApiError);
      expect(error.name).toBe("ApiResponseError");
    });

    it("should have stack trace", () => {
      const error = new ApiResponseError(mockApiError);
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
    });

    it("should be throwable and catchable", () => {
      expect(() => {
        throw new ApiResponseError(mockApiError);
      }).toThrow(ApiResponseError);

      try {
        throw new ApiResponseError(mockApiError);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiResponseError);
        expect(error).toBeInstanceOf(Error);
        assert(error instanceof ApiResponseError);
        expect(error.status).toBe(mockApiError.status);
      }
    });
  });
});

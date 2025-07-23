import type { Context } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { badRequest, customError, forbidden, internalServerError, notFound } from "../src";

const mockDate = new Date("2023-06-15T10:30:00.000Z");

function createMockContext(url: string): Context {
  return {
    req: {
      url,
    },
  } as Context;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("badRequest", () => {
  it("should return 400 response with default values", async () => {
    const response = badRequest();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(body).toEqual({
      message: "Bad request",
      status: 400,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return 400 response with custom message", async () => {
    const response = badRequest({ message: "Invalid input parameters" });
    const body = await response.json();

    expect(body.message).toBe("Invalid input parameters");
    expect(body.status).toBe(400);
  });

  it("should return 400 response with custom headers", async () => {
    const customHeaders = { "X-Custom-Header": "test-value" };
    const response = badRequest({ headers: customHeaders });

    expect(response.headers.get("X-Custom-Header")).toBe("test-value");
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("should return 400 response with all options", async () => {
    const options = {
      message: "Validation failed",
      headers: { "X-Request-ID": "123456" },
    };
    const response = badRequest(options);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-ID")).toBe("123456");
    expect(body).toEqual({
      message: "Validation failed",
      status: 400,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return 400 response with Hono context", async () => {
    const context = createMockContext("https://example.com/api/users");
    const response = badRequest(context);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      message: "Bad request",
      status: 400,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return 400 response with Hono context and custom message", async () => {
    const context = createMockContext("https://example.com/api/users/123");
    const response = badRequest(context, { message: "Invalid user ID" });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      message: "Invalid user ID",
      status: 400,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return 400 response with Hono context and custom headers", async () => {
    const context = createMockContext("https://example.com/api/validate");
    const response = badRequest(context, {
      message: "Validation failed",
      headers: { "X-Request-ID": "abc123" },
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-ID")).toBe("abc123");
    expect(body.message).toBe("Validation failed");
  });
});

describe("forbidden", () => {
  it("should return 403 response with default values", async () => {
    const response = forbidden();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(body).toEqual({
      message: "Forbidden",
      status: 403,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return 403 response with custom message", async () => {
    const response = forbidden({ message: "Access denied" });
    const body = await response.json();

    expect(body.message).toBe("Access denied");
    expect(body.status).toBe(403);
  });

  it("should return 403 response with custom headers", async () => {
    const customHeaders = { "WWW-Authenticate": "Bearer" };
    const response = forbidden({ headers: customHeaders });

    expect(response.headers.get("WWW-Authenticate")).toBe("Bearer");
  });

  it("should return 403 response with Hono context", async () => {
    const context = createMockContext("https://example.com/api/admin");
    const response = forbidden(context);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      message: "Forbidden",
      status: 403,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return 403 response with Hono context and custom message", async () => {
    const context = createMockContext("https://example.com/api/admin/users");
    const response = forbidden(context, { message: "Access denied to admin area" });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.message).toBe("Access denied to admin area");
  });
});

describe("notFound", () => {
  it("should return 404 response with default values", async () => {
    const response = notFound();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(body).toEqual({
      message: "Not found",
      status: 404,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return 404 response with custom message", async () => {
    const response = notFound({ message: "User not found" });
    const body = await response.json();

    expect(body.message).toBe("User not found");
    expect(body.status).toBe(404);
  });

  it("should return 404 response with all options", async () => {
    const options = {
      message: "Resource not found",
      headers: { "Cache-Control": "no-cache" },
    };
    const response = notFound(options);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    expect(body.message).toBe("Resource not found");
  });

  it("should return 404 response with Hono context", async () => {
    const context = createMockContext("https://example.com/api/users/999");
    const response = notFound(context);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      message: "Not found",
      status: 404,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return 404 response with Hono context and custom message", async () => {
    const context = createMockContext("https://example.com/api/products/abc123");
    const response = notFound(context, { message: "Product not found" });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toBe("Product not found");
  });
});

describe("internalServerError", () => {
  it("should return 500 response with default values", async () => {
    const response = internalServerError();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(body).toEqual({
      message: "Internal server error",
      status: 500,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return 500 response with custom message", async () => {
    const response = internalServerError({ message: "Database connection failed" });
    const body = await response.json();

    expect(body.message).toBe("Database connection failed");
    expect(body.status).toBe(500);
  });

  it("should return 500 response with custom headers", async () => {
    const customHeaders = { "Retry-After": "60" };
    const response = internalServerError({ headers: customHeaders });

    expect(response.headers.get("Retry-After")).toBe("60");
  });

  it("should return 500 response with Hono context", async () => {
    const context = createMockContext("https://example.com/api/database");
    const response = internalServerError(context);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      message: "Internal server error",
      status: 500,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return 500 response with Hono context and custom message", async () => {
    const context = createMockContext("https://example.com/api/users/sync");
    const response = internalServerError(context, { message: "Database sync failed" });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe("Database sync failed");
  });
});

describe("response structure validation", () => {
  it("should always include timestamp in ISO format", async () => {
    const responses = [
      badRequest(),
      forbidden(),
      notFound(),
      internalServerError(),
    ];

    for (const response of responses) {
      const body = await response.json();
      expect(body.timestamp).toBe("2023-06-15T10:30:00.000Z");
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    }
  });

  it("should preserve custom headers while keeping Content-Type", async () => {
    const customHeaders = {
      "X-Custom": "value",
      "Another-Header": "another-value",
    };

    const response = badRequest({ headers: customHeaders });

    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("X-Custom")).toBe("value");
    expect(response.headers.get("Another-Header")).toBe("another-value");
  });

  it("should allow overriding Content-Type header", async () => {
    const customHeaders = { "Content-Type": "application/vnd.api+json" };
    const response = badRequest({ headers: customHeaders });

    expect(response.headers.get("Content-Type")).toBe("application/vnd.api+json");
  });
});

describe("custom error handling", () => {
  it("should allow creating custom errors with specific status codes", async () => {
    const customErrorOptions = {
      status: 418,
      message: "I'm a teapot",
      headers: { "X-Teapot": "true" },
    };

    const response = customError(customErrorOptions);
    const body = await response.json();

    expect(response.status).toBe(418);
    expect(body.message).toBe("I'm a teapot");
    expect(response.headers.get("X-Teapot")).toBe("true");
  });

  it("should return custom error with correct structure", async () => {
    const customErrorOptions = {
      status: 422,
      message: "Unprocessable Entity",
      headers: { "X-Error-Detail": "Invalid input" },
    };

    const response = customError(customErrorOptions);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.message).toBe("Unprocessable Entity");
    expect(response.headers.get("X-Error-Detail")).toBe("Invalid input");
  });

  it("should return custom error with Hono context", async () => {
    const context = createMockContext("https://example.com/api/teapot");
    const response = customError(context, {
      status: 418,
      message: "I'm a teapot",
    });
    const body = await response.json();

    expect(response.status).toBe(418);
    expect(body).toEqual({
      message: "I'm a teapot",
      status: 418,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return custom error with Hono context and headers", async () => {
    const context = createMockContext("https://example.com/api/rate-limit");
    const response = customError(context, {
      status: 429,
      message: "Too Many Requests",
      headers: { "Retry-After": "3600" },
    });
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.message).toBe("Too Many Requests");
    expect(response.headers.get("Retry-After")).toBe("3600");
  });

  it("should throw error when context is provided without options", () => {
    const context = createMockContext("https://example.com/api/test");

    expect(() => {
      customError(context);
    }).toThrow("Options parameter is required when using Hono context");
  });
});

describe("hono context integration", () => {
  it("should handle URLs with query parameters", async () => {
    const context = createMockContext("https://example.com/api/users?filter=active&page=2");
    const response = badRequest(context, { message: "Invalid query parameters" });
    const body = await response.json();

    expect(body.message).toBe("Invalid query parameters");
  });

  it("should handle paths with special characters", async () => {
    const context = createMockContext("https://example.com/api/files/my%20file.txt");
    const response = notFound(context, { message: "File not found" });
    const body = await response.json();

    expect(body.message).toBe("File not found");
  });
});

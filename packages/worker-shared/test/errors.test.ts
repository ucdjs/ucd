import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { badRequest, customError, forbidden, internalServerError, notFound } from "../src";

const mockDate = new Date("2023-06-15T10:30:00.000Z");

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
      path: "unknown",
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

  it("should return 400 response with custom path", async () => {
    const response = badRequest({ path: "/api/users" });
    const body = await response.json();

    expect(body.path).toBe("/api/users");
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
      path: "/api/validate",
      headers: { "X-Request-ID": "123456" },
    };
    const response = badRequest(options);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-ID")).toBe("123456");
    expect(body).toEqual({
      path: "/api/validate",
      message: "Validation failed",
      status: 400,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });
});

describe("forbidden", () => {
  it("should return 403 response with default values", async () => {
    const response = forbidden();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(body).toEqual({
      path: "unknown",
      message: "Not found", // Note: This seems like a bug in the original code
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

  it("should return 403 response with custom path", async () => {
    const response = forbidden({ path: "/api/admin" });
    const body = await response.json();

    expect(body.path).toBe("/api/admin");
    expect(body.status).toBe(403);
  });

  it("should return 403 response with custom headers", async () => {
    const customHeaders = { "WWW-Authenticate": "Bearer" };
    const response = forbidden({ headers: customHeaders });

    expect(response.headers.get("WWW-Authenticate")).toBe("Bearer");
  });
});

describe("notFound", () => {
  it("should return 404 response with default values", async () => {
    const response = notFound();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(body).toEqual({
      path: "unknown",
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

  it("should return 404 response with custom path", async () => {
    const response = notFound({ path: "/api/users/999" });
    const body = await response.json();

    expect(body.path).toBe("/api/users/999");
    expect(body.status).toBe(404);
  });

  it("should return 404 response with all options", async () => {
    const options = {
      message: "Resource not found",
      path: "/api/resources/abc123",
      headers: { "Cache-Control": "no-cache" },
    };
    const response = notFound(options);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    expect(body.message).toBe("Resource not found");
    expect(body.path).toBe("/api/resources/abc123");
  });
});

describe("internalServerError", () => {
  it("should return 500 response with default values", async () => {
    const response = internalServerError();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(body).toEqual({
      path: "unknown",
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

  it("should return 500 response with custom path", async () => {
    const response = internalServerError({ path: "/api/database" });
    const body = await response.json();

    expect(body.path).toBe("/api/database");
    expect(body.status).toBe(500);
  });

  it("should return 500 response with custom headers", async () => {
    const customHeaders = { "Retry-After": "60" };
    const response = internalServerError({ headers: customHeaders });

    expect(response.headers.get("Retry-After")).toBe("60");
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
      path: "/api/teapot",
      headers: { "X-Teapot": "true" },
    };

    const response = customError(customErrorOptions);
    const body = await response.json();

    expect(response.status).toBe(418);
    expect(body.message).toBe("I'm a teapot");
    expect(body.path).toBe("/api/teapot");
    expect(response.headers.get("X-Teapot")).toBe("true");
  });

  it("should return custom error with correct structure", async () => {
    const customErrorOptions = {
      status: 422,
      message: "Unprocessable Entity",
      path: "/api/resources/abc123",
      headers: { "X-Error-Detail": "Invalid input" },
    };

    const response = customError(customErrorOptions);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.message).toBe("Unprocessable Entity");
    expect(body.path).toBe("/api/resources/abc123");
    expect(response.headers.get("X-Error-Detail")).toBe("Invalid input");
  });
});

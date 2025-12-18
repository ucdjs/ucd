import type { ApiError } from "@ucdjs/schemas";
import { expect } from "vitest";

// Success response validators

export function expectSuccess(response: Response, options?: {
  status?: number;
  headers?: Record<string, string | RegExp>;
}) {
  const expectedStatus = options?.status ?? 200;
  expect(response.status).toBe(expectedStatus);

  if (options?.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      const headerValue = response.headers.get(key);
      expect(headerValue).toBeTruthy();
      if (typeof value === "string") {
        expect(headerValue).toBe(value);
      } else {
        expect(headerValue).toMatch(value);
      }
    }
  }
}

export function expectJsonResponse(response: Response) {
  expect(response.headers.get("content-type")).toContain("application/json");
}

export function expectCacheHeaders(response: Response, maxAgePattern?: RegExp) {
  const cacheControl = response.headers.get("cache-control");
  expect(cacheControl).toBeTruthy();
  if (maxAgePattern) {
    expect(cacheControl).toMatch(maxAgePattern);
  } else {
    expect(cacheControl).toMatch(/max-age=\d+/);
  }
}

export function expectContentType(response: Response, expectedType: string | RegExp) {
  const contentType = response.headers.get("content-type");
  expect(contentType).toBeTruthy();
  if (typeof expectedType === "string") {
    expect(contentType).toBe(expectedType);
  } else {
    expect(contentType).toMatch(expectedType);
  }
}

// Error response validators

export interface ExpectApiErrorOptions {
  status: number;
  message?: string | RegExp;
}

export async function expectApiError(
  response: Response,
  options: ExpectApiErrorOptions
): Promise<ApiError> {
  expect(response.status).toBe(options.status);
  expect(response.headers.get("content-type")).toContain("application/json");

  const error = await response.json() as ApiError;
  expect(error).toHaveProperty("status", options.status);
  expect(error).toHaveProperty("message");
  expect(error).toHaveProperty("timestamp");

  if (options.message) {
    if (typeof options.message === "string") {
      expect(error.message).toBe(options.message);
    } else {
      expect(error.message).toMatch(options.message);
    }
  }

  return error;
}


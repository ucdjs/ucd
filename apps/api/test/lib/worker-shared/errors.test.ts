import type { Context } from "hono";
import type { ApiError } from "../../../src/lib/worker-shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  badRequest,
  customError,
  forbidden,
  internalServerError,
  notFound,
} from "../../../src/lib/worker-shared";
import { badGateway } from "../../../src/lib/worker-shared/errors";

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
    const body = await response.json() as ApiError;

    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(body).toEqual({
      message: "Bad Request",
      status: 400,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });

  it("should return 400 response with custom message", async () => {
    const response = badRequest({ message: "Invalid input parameters" });
    const body = await response.json() as ApiError;

    expect(body.message).toBe("Invalid input parameters");
  });
});

describe("notFound", () => {
  it("should return 404 response with default values", async () => {
    const response = notFound();
    const body = await response.json() as ApiError;

    expect(response.status).toBe(404);
    expect(body).toEqual({
      message: "Not Found",
      status: 404,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });
});

describe("internalServerError", () => {
  it("should return 500 response with default values", async () => {
    const response = internalServerError();
    const body = await response.json() as ApiError;

    expect(response.status).toBe(500);
    expect(body).toEqual({
      message: "Internal Server Error",
      status: 500,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });
});

describe("badGateway", () => {
  it("should return 502 response with default values", async () => {
    const response = badGateway();
    const body = await response.json() as ApiError;

    expect(response.status).toBe(502);
    expect(body).toEqual({
      message: "Bad Gateway",
      status: 502,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });
});

describe("customError", () => {
  it("should return custom status response", async () => {
    const response = customError({
      status: 422,
      message: "Validation failed",
    });
    const body = await response.json() as ApiError;

    expect(response.status).toBe(422);
    expect(body).toEqual({
      message: "Validation failed",
      status: 422,
      timestamp: "2023-06-15T10:30:00.000Z",
    });
  });
});
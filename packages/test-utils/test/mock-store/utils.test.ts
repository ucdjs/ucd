import { describe, expect, it, vi } from "vitest";
import {
  configure,
} from "../../src/mock-store/helpers";
import {
  extractConfiguredMetadata,
  isConfiguredResponse,
  parseLatency,
  wrapMockFetchWithConfig,
} from "../../src/mock-store/utils";

describe("extractConfiguredMetadata", () => {
  it("should extract latency from configured response", () => {
    const response = { data: "test" };
    const configured = configure({
      response,
      latency: 100,
    });

    const metadata = extractConfiguredMetadata(configured);
    expect(metadata).toEqual({
      actualResponse: { data: "test" },
      latency: 100,
      headers: undefined,
    });
  });

  it("should extract headers from configured response", () => {
    const response = { data: "test" };
    const configured = configure({
      response,
      headers: { "X-Custom": "value" },
    });

    const metadata = extractConfiguredMetadata(configured);
    expect(metadata).toEqual({
      actualResponse: { data: "test" },
      latency: undefined,
      headers: { "X-Custom": "value" },
    });
  });

  it("should extract both latency and headers", () => {
    const response = { data: "test" };
    const configured = configure({
      response,
      latency: "random",
      headers: { "X-Custom": "value" },
    });

    const metadata = extractConfiguredMetadata(configured);
    expect(metadata).toEqual({
      actualResponse: { data: "test" },
      latency: "random",
      headers: { "X-Custom": "value" },
    });
  });

  it("should extract from configured function", () => {
    const fn = vi.fn();
    const configured = configure({
      response: fn,
      latency: 50,
    });

    const metadata = extractConfiguredMetadata(configured);
    expect(metadata.latency).toBe(50);
    expect(metadata.headers).toBeUndefined();
  });

  it("should return plain response when not configured", () => {
    const response = { data: "test" };
    const metadata = extractConfiguredMetadata(response);

    expect(metadata).toEqual({
      actualResponse: response,
    });
  });
});

describe("parseLatency", () => {
  it("should return numeric latency unchanged", () => {
    expect(parseLatency(100)).toBe(100);
    expect(parseLatency(0)).toBe(0);
    expect(parseLatency(5000)).toBe(5000);
  });

  it.for(Array.from({ length: 10 }, () => parseLatency("random")))(
    "should return random latency between 100-999ms: %s",
    (latency) => {
      expect(latency).toBeGreaterThanOrEqual(100);
      expect(latency).toBeLessThan(1000);
      expect(Number.isInteger(latency)).toBe(true);
    },
  );
});

describe("isConfiguredResponse", () => {
  it("should return true for configured response", () => {
    const response = configure({
      response: { data: "test" },
      latency: 100,
    });

    expect(isConfiguredResponse(response)).toBe(true);
  });

  it("should return false for plain object", () => {
    expect(isConfiguredResponse({ data: "test" })).toBe(false);
  });

  it("should return false for null", () => {
    expect(isConfiguredResponse(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isConfiguredResponse(undefined)).toBe(false);
  });

  it("should return false for primitives", () => {
    expect(isConfiguredResponse("string")).toBe(false);
    expect(isConfiguredResponse(123)).toBe(false);
    expect(isConfiguredResponse(true)).toBe(false);
  });

  it("should return true for configured function", () => {
    const fn = configure({
      response: vi.fn(),
      latency: 100,
    });

    expect(isConfiguredResponse(fn)).toBe(true);
  });
});

describe("wrapMockFetchWithConfig", () => {
  it("should return original mockFetch when no config provided", () => {
    const mockFetch = vi.fn();
    const wrapped = wrapMockFetchWithConfig(mockFetch);

    expect(wrapped).toBe(mockFetch);
  });

  it("should wrap mockFetch with latency", async () => {
    const mockFetch = vi.fn((_routes) => {
      return Promise.resolve();
    });

    const resolver = vi.fn(async () => ({ status: 200 }));
    const wrapped = wrapMockFetchWithConfig(mockFetch, 50);

    wrapped([
      [
        "GET",
        "/test",
        // @ts-expect-error test mock
        resolver,
      ],
    ]);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.arrayContaining(["GET", "/test", expect.any(Function)]),
      ]),
    );
  });

  it("should wrap mockFetch with headers", async () => {
    const mockFetch = vi.fn((_routes) => {
      return Promise.resolve();
    });

    const resolver = vi.fn(async () => ({
      status: 200,
      headers: new Headers(),
    }));

    const wrapped = wrapMockFetchWithConfig(mockFetch, undefined, {
      "X-Custom": "value",
    });

    wrapped([[
      "GET",
      "/test",
      // @ts-expect-error test mock
      resolver,
    ]]);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.arrayContaining(["GET", "/test", expect.any(Function)]),
      ]),
    );
  });

  it("should not wrap non-function resolvers", async () => {
    const mockFetch = vi.fn((_routes) => {
      return Promise.resolve();
    });

    const wrapped = wrapMockFetchWithConfig(mockFetch, 50);

    const routes = [["GET", "/test", { data: "static" }]];
    wrapped(routes as any);

    expect(mockFetch).toHaveBeenCalledWith(routes);
  });

  it("should handle non-array routes", async () => {
    const mockFetch = vi.fn();
    const wrapped = wrapMockFetchWithConfig(mockFetch, 50);

    const singleRoute = "not-an-array";
    wrapped(singleRoute as any);

    expect(mockFetch).toHaveBeenCalledWith(singleRoute);
  });

  it("should handle routes with incorrect structure", async () => {
    const mockFetch = vi.fn((_routes) => {
      return Promise.resolve();
    });

    const wrapped = wrapMockFetchWithConfig(mockFetch, 50);

    const routes = [["GET"]];
    wrapped(routes as any);

    expect(mockFetch).toHaveBeenCalledWith(routes);
  });

  it("should apply latency before calling resolver", async () => {
    const mockFetch = vi.fn(async (routes) => {
      const [, , wrappedResolver] = routes[0];
      if (typeof wrappedResolver === "function") {
        await wrappedResolver();
      }
    });

    const startTime = Date.now();
    const resolver = vi.fn(async () => ({ status: 200 }));
    const wrapped = wrapMockFetchWithConfig(mockFetch, 50);

    const routes = [["GET", "/test", resolver]];
    await wrapped(routes as any);

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(50); // at least 50ms latency + tick
  });

  it("should apply headers to response", async () => {
    const headers = new Headers();
    const response = { status: 200, headers };

    const mockFetch = vi.fn(async (routes) => {
      const [, , wrappedResolver] = routes[0];
      if (typeof wrappedResolver === "function") {
        return await wrappedResolver();
      }
    });

    const resolver = vi.fn(async () => response);
    const wrapped = wrapMockFetchWithConfig(mockFetch, undefined, {
      "X-Custom": "value",
      "X-Another": "header",
    });

    const routes = [["GET", "/test", resolver]];
    await wrapped(routes as any);

    expect(headers.get("X-Custom")).toBe("value");
    expect(headers.get("X-Another")).toBe("header");
  });

  it("should parse random latency", async () => {
    const mockFetch = vi.fn(async (routes) => {
      const [, , wrappedResolver] = routes[0];
      if (typeof wrappedResolver === "function") {
        await wrappedResolver();
      }
    });

    const resolver = vi.fn(async () => ({ status: 200 }));
    const wrapped = wrapMockFetchWithConfig(mockFetch, "random");

    const startTime = Date.now();
    const routes = [["GET", "/test", resolver]];
    await wrapped(routes as any);

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(95);
  });
});

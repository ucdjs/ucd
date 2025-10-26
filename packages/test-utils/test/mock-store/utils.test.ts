import type { WrapMockFetchCallbackPayload, WrapMockFetchCallbackPayloadWithResponse } from "packages/test-utils/src/mock-store/types";
import { mockFetch } from "#test-utils/msw";
import { HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  configure,
} from "../../src/mock-store/helpers";
import {
  extractConfiguredMetadata,
  isConfiguredResponse,
  parseLatency,
  wrapMockFetch,
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

describe("wrapMockFetch", () => {
  it("should return original mockFetch when no config provided", () => {
    const mockFetch = vi.fn();
    const wrapped = wrapMockFetch(mockFetch);

    expect(wrapped).toBe(mockFetch);
  });

  it("should not wrap non-function resolvers", async () => {
    const mockFetch = vi.fn((_routes) => {
      return Promise.resolve();
    });

    const wrapped = wrapMockFetch(mockFetch, {
      beforeFetch: async () => {},
    });

    const routes = [["GET", "/test", { data: "static" }]];
    wrapped(routes as any);

    expect(mockFetch).toHaveBeenCalledWith(routes);
  });

  it("should handle non-array routes", async () => {
    const mockFetch = vi.fn();
    const wrapped = wrapMockFetch(mockFetch, {
      beforeFetch: async () => {},
    });

    const singleRoute = "not-an-array";
    wrapped(singleRoute as any);

    expect(mockFetch).toHaveBeenCalledWith(singleRoute);
  });

  it("should handle routes with incorrect structure", async () => {
    const mockFetch = vi.fn((_routes) => {
      return Promise.resolve();
    });

    const wrapped = wrapMockFetch(mockFetch, {
      beforeFetch: async () => {},
    });

    const routes = [["GET"]];
    wrapped(routes as any);

    expect(mockFetch).toHaveBeenCalledWith(routes);
  });

  it("should call beforeFetch callback", async () => {
    const beforeFetch = vi.fn();

    const resolver = vi.fn(async () => HttpResponse.json({ status: 200 }));
    const wrapped = wrapMockFetch(mockFetch, { beforeFetch });

    await wrapped([
      ["GET", "https://api.ucdjs.dev/test", resolver],
    ]);

    const res = await fetch("https://api.ucdjs.dev/test");
    const data = await res.json();

    expect(data).toEqual({ status: 200 });
    expect(beforeFetch).toHaveBeenCalledWith({
      path: "/test",
      method: "GET",
      params: {},
      url: "https://api.ucdjs.dev/test",
    } satisfies WrapMockFetchCallbackPayload);
  });

  it("should call afterFetch callback with response", async () => {
    const responsePayload = {
      message: "Hello, World!",
    };

    const resolver = vi.fn(async () => HttpResponse.json(responsePayload));
    const afterFetch = vi.fn(({ response }) => {
      if (!response || !("headers" in response)) return;

      if (response.headers instanceof Headers) {
        response.headers.set("X-Custom", "value");
        response.headers.set("X-Another", "header");
      }
    });

    const wrapped = wrapMockFetch(mockFetch, { afterFetch });

    await wrapped([
      ["GET", "https://api.ucdjs.dev/test", resolver],
    ]);

    const res = await fetch("https://api.ucdjs.dev/test");
    const responseData = await res.json();

    expect(responseData).toEqual(responsePayload);

    expect(afterFetch).toHaveBeenCalledWith({
      path: "/test",
      method: "GET",
      params: {},
      url: "https://api.ucdjs.dev/test",
      response: expect.any(Object),
    } satisfies WrapMockFetchCallbackPayloadWithResponse);
    expect(res.headers.get("X-Custom")).toBe("value");
    expect(res.headers.get("X-Another")).toBe("header");
  });

  describe("onRequest callback", () => {
    it("should call onRequest with correct payload", async () => {
      const onRequest = vi.fn();
      const resolver = vi.fn(async () => {
        return HttpResponse.json({ status: 200 });
      });

      const wrapped = wrapMockFetch(mockFetch, { onRequest });

      await wrapped([["GET", "https://api.ucdjs.dev/api/v1/versions", resolver]]);

      await fetch("https://api.ucdjs.dev/api/v1/versions");

      expect(onRequest).toHaveBeenCalledWith({
        path: "/api/v1/versions",
        method: "GET",
        params: {},
        url: "https://api.ucdjs.dev/api/v1/versions",
      } satisfies WrapMockFetchCallbackPayload);
    });

    it("should call onRequest with path parameters", async () => {
      const onRequest = vi.fn();
      const resolver = vi.fn(async () => {
        return HttpResponse.json({ status: 200 });
      });

      const wrapped = wrapMockFetch(mockFetch, { onRequest });

      await wrapped([["GET", "https://api.ucdjs.dev/api/v1/versions/:version/file-tree", resolver]]);

      await fetch("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree");

      expect(onRequest).toHaveBeenCalledWith({
        path: "/api/v1/versions/16.0.0/file-tree",
        method: "GET",
        params: { version: "16.0.0" },
        url: "https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree",
      } satisfies WrapMockFetchCallbackPayload);
    });

    it("should track multiple requests", async () => {
      const requests: any[] = [];
      const onRequest = vi.fn((payload) => {
        requests.push(payload);
      });

      const resolver = vi.fn(async () => {
        return HttpResponse.json({ status: 200 });
      });
      const wrapped = wrapMockFetch(mockFetch, { onRequest });

      await wrapped([
        ["GET", "https://api.ucdjs.dev/api/v1/versions", resolver],
        ["GET", "https://api.ucdjs.dev/api/v1/files/test.txt", resolver],
      ]);

      await fetch("https://api.ucdjs.dev/api/v1/versions");
      await fetch("https://api.ucdjs.dev/api/v1/files/test.txt");

      expect(onRequest).toHaveBeenCalledTimes(2);
      expect(requests).toHaveLength(2);
      expect(requests[0].path).toBe("/api/v1/versions");
      expect(requests[1].path).toBe("/api/v1/files/test.txt");
    });

    it("should call onRequest before beforeFetch", async () => {
      const callOrder: string[] = [];
      const onRequest = vi.fn(() => {
        callOrder.push("onRequest");
      });
      const beforeFetch = vi.fn(async () => {
        callOrder.push("beforeFetch");
      });

      const resolver = vi.fn(async () => {
        return HttpResponse.json({ status: 200 });
      });

      const wrapped = wrapMockFetch(mockFetch, {
        onRequest,
        beforeFetch,
      });

      await wrapped([["GET", "https://api.ucdjs.dev/test", resolver]]);

      await fetch("https://api.ucdjs.dev/test");

      expect(callOrder).toEqual(["onRequest", "beforeFetch"]);
    });

    it("should work with beforeFetch and afterFetch", async () => {
      const onRequest = vi.fn();
      const beforeFetch = vi.fn();
      const afterFetch = vi.fn();

      const resolver = vi.fn(async () => {
        return HttpResponse.json({ status: 200 });
      });
      const wrapped = wrapMockFetch(mockFetch, { onRequest, beforeFetch, afterFetch });

      await wrapped([["GET", "https://api.ucdjs.dev/:id", resolver]]);

      await fetch("https://api.ucdjs.dev/123");

      expect(onRequest).toHaveBeenCalledWith({
        path: "/123",
        method: "GET",
        params: { id: "123" },
        url: "https://api.ucdjs.dev/123",
      } satisfies WrapMockFetchCallbackPayload);
      expect(beforeFetch).toHaveBeenCalledWith({
        path: "/123",
        method: "GET",
        params: { id: "123" },
        url: "https://api.ucdjs.dev/123",
      } satisfies WrapMockFetchCallbackPayload);
      expect(afterFetch).toHaveBeenCalledWith({
        path: "/123",
        method: "GET",
        params: { id: "123" },
        url: "https://api.ucdjs.dev/123",
        response: expect.any(Object),
      } satisfies WrapMockFetchCallbackPayloadWithResponse);
    });
  });
});

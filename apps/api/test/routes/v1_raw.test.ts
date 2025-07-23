import {
  createExecutionContext,
  env,
  fetchMock,
  waitOnExecutionContext,
} from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import worker from "../../../src";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
});

describe("v1_raw", () => {
  const mockEnv = {
    ...env,
    PROXY_ENDPOINT: "https://unicode-proxy.ucdjs.dev",
    USE_SVC_BINDING: "false",
  };

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/raw/:wildcard", () => {
    it("should proxy specific file path successfully", async () => {
      const mockFileContent = "# Unicode Character Database\n# Version 15.1.0\n";

      fetchMock.get("https://unicode-proxy.ucdjs.dev")
        .intercept({ path: "/15.1.0/ucd/UnicodeData.txt" })
        .reply(200, mockFileContent, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "content-length": mockFileContent.length.toString(),
          },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/raw/15.1.0/ucd/UnicodeData.txt");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
      expect(response.headers.get("cache-control")).toBe("public, max-age=3600");

      const content = await response.text();
      expect(content).toBe(mockFileContent);
    });

    it("should reject paths with '..' segments", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/raw/..%2Ftest");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Invalid path: Path cannot contain '..' or '//' segments.");
      expect(error).toHaveProperty("status", 400);
    });

    it("should reject paths with '//' segments", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/raw/path//with//double//slashes");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Invalid path: Path cannot contain '..' or '//' segments.");
      expect(error).toHaveProperty("status", 400);
    });

    it("should handle 404 from raw endpoint", async () => {
      fetchMock.get("https://unicode-proxy.ucdjs.dev")
        .intercept({ path: "/nonexistent/path" })
        .reply(404, "Not Found");

      const request = new Request("https://api.ucdjs.dev/api/v1/raw/nonexistent/path");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Resource not found");
      expect(error).toHaveProperty("status", 404);
    });

    it("should handle 500 from proxy endpoint", async () => {
      fetchMock.get("https://unicode-proxy.ucdjs.dev")
        .intercept({ path: "/error/path" })
        .reply(500, "Internal Server Error");

      const request = new Request("https://api.ucdjs.dev/api/v1/raw/error/path");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(500);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Proxy request failed with reason: Internal Server Error");
      expect(error).toHaveProperty("status", 500);
    });

    it("should handle missing content-type header", async () => {
      const mockContent = "Some binary content";

      fetchMock.get("https://unicode-proxy.ucdjs.dev")
        .intercept({ path: "/binary/file" })
        .reply(200, mockContent, {
          headers: {
            "content-length": mockContent.length.toString(),
          },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/raw/binary/file");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/octet-stream");
      expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/raw/__stat/:wildcard", () => {
    it("should proxy stat requests successfully", async () => {
      const mockStatResponse = JSON.stringify({
        type: "file",
        mtime: "2023-09-15T10:30:00Z",
        size: 1024,
      });

      fetchMock.get("https://unicode-proxy.ucdjs.dev")
        .intercept({ path: "/__stat/15.1.0/ucd/UnicodeData.txt" })
        .reply(200, mockStatResponse, {
          headers: {
            "content-type": "application/json",
            "content-length": mockStatResponse.length.toString(),
          },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/raw/__stat/15.1.0/ucd/UnicodeData.txt");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/json");
      expect(response.headers.get("cache-control")).toBe("public, max-age=3600");

      const data = await response.json();
      expect(data).toEqual(JSON.parse(mockStatResponse));
    });

    it("should handle stat path validation", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/raw/__stat/..%2Fsecret");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Invalid path: Path cannot contain '..' or '//' segments.");
      expect(error).toHaveProperty("status", 400);
    });

    it("should handle stat 404 errors", async () => {
      fetchMock.get("https://unicode-proxy.ucdjs.dev")
        .intercept({ path: "/__stat/nonexistent/file" })
        .reply(404, "Not Found");

      const request = new Request("https://api.ucdjs.dev/api/v1/raw/__stat/nonexistent/file");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Resource not found");
      expect(error).toHaveProperty("status", 404);
    });
  });

  describe("service binding mode", () => {
    it("should use service binding when enabled", async () => {
      const mockContent = JSON.stringify([{ name: "binding-test", type: "directory" }]);
      const mockFetchResponse = new Response(mockContent, {
        status: 200,
        headers: {
          "content-type": "application/json",
          "content-length": mockContent.length.toString(),
        },
      });

      const mockUnicodeProxy = {
        fetch: vi.fn().mockResolvedValue(mockFetchResponse),
      };

      const mockEnvWithBinding = {
        ...env,
        PROXY_ENDPOINT: "https://unicode-proxy.ucdjs.dev",
        USE_SVC_BINDING: "true",
        UNICODE_PROXY: mockUnicodeProxy,
      };

      const request = new Request("https://api.ucdjs.dev/api/v1/raw/binding-test");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnvWithBinding, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/json");
      expect(mockUnicodeProxy.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://unicode-proxy.ucdjs.dev/binding-test",
        }),
      );

      const data = await response.json();
      expect(data).toEqual(JSON.parse(mockContent));
    });

    it("should handle service binding with stat route", async () => {
      const mockStatResponse = JSON.stringify({
        type: "file",
        mtime: "2023-09-15T10:30:00Z",
        size: 2048,
      });

      const mockFetchResponse = new Response(mockStatResponse, {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });

      const mockUnicodeProxy = {
        fetch: vi.fn().mockResolvedValue(mockFetchResponse),
      };

      const mockEnvWithBinding = {
        ...env,
        PROXY_ENDPOINT: "https://unicode-proxy.ucdjs.dev",
        USE_SVC_BINDING: "true",
        UNICODE_PROXY: mockUnicodeProxy,
      };

      const request = new Request("https://api.ucdjs.dev/api/v1/raw/__stat/stat-binding-test");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnvWithBinding, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(mockUnicodeProxy.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://unicode-proxy.ucdjs.dev/__stat/stat-binding-test",
        }),
      );
    });
  });

  describe("error handling edge cases", () => {
    it("should handle non-Error exceptions", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      fetchMock.get("https://unicode-proxy.ucdjs.dev")
        .intercept({ path: "/non-error-test" })
        // @ts-expect-error // Intentionally reply with a string instead of an Error object
        .replyWithError("String error instead of Error object");

      const request = new Request("https://api.ucdjs.dev/api/v1/raw/non-error-test");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(500);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Failed to proxy request: Unknown error");
      expect(error).toHaveProperty("status", 500);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Proxy error:", "String error instead of Error object");

      consoleErrorSpy.mockRestore();
    });

    it("should handle Error exceptions with message", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      fetchMock.get("https://unicode-proxy.ucdjs.dev")
        .intercept({ path: "/error-test" })
        .replyWithError(new Error("Custom error message"));

      const request = new Request("https://api.ucdjs.dev/api/v1/raw/error-test");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(500);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Failed to proxy request: Custom error message");
      expect(error).toHaveProperty("status", 500);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Proxy error:", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe("route not found", () => {
    it("should return 404 for malformed routes", async () => {
      fetchMock.get("https://unicode-proxy.ucdjs.dev")
        .intercept({ path: "/this-is-not-a-valid-file" })
        .reply(404, "Not Found");

      const request = new Request("https://api.ucdjs.dev/api/v1/raw/this-is-not-a-valid-file");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
    });
  });
});

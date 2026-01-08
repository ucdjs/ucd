import type { UCDWellKnownConfig, UnicodeFileTree, UnicodeVersionList } from "@ucdjs/schemas";
import { HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { configure, mockStoreApi } from "../../src/mock-store";

describe("mockStoreApi", () => {
  describe("basic setup", () => {
    it("should initialize with default configuration", () => {
      expect(() => mockStoreApi()).not.toThrow();
    });

    it("should normalize baseUrl with trailing slash", async () => {
      mockStoreApi({
        baseUrl: "https://api.luxass.dev/",
        responses: {
          "/api/v1/versions": true,
        },
      });

      const response = await fetch("https://api.luxass.dev/api/v1/versions");
      expect(response.ok).toBe(true);
    });

    it("should accept custom versions array", () => {
      expect(() =>
        mockStoreApi({
          versions: ["1.0.0", "2.0.0"],
        }),
      ).not.toThrow();
    });
  });

  describe("mixed configurations", () => {
    it("should handle multiple custom endpoints", async () => {
      const customVersions: UnicodeVersionList = [];
      const customConfig: UCDWellKnownConfig = {
        version: "0.1",
        endpoints: {
          files: "/api/v1/files",
          manifest: "/.well-known/ucd-store/{version}.json",
          versions: "/api/v1/versions",
        },
        versions: [],
      };

      mockStoreApi({
        responses: {
          "/api/v1/versions": customVersions,
          "/.well-known/ucd-config.json": customConfig,
        },
      });

      const versionsResponse = await fetch(
        "https://api.ucdjs.dev/api/v1/versions",
      );
      const configResponse = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-config.json",
      );

      const versions = await versionsResponse.json();
      const config = await configResponse.json();

      expect(versions).toEqual(customVersions);
      expect(config).toEqual(customConfig);
    });

    it("should handle mix of enabled, disabled, and custom endpoints", async () => {
      const customTree: UnicodeFileTree = [
        {
          type: "file" as const,
          name: "custom.txt",
          path: "custom.txt",
          lastModified: 0,
        },
      ];

      mockStoreApi({
        responses: {
          "/api/v1/versions": false,
          "/api/v1/versions/{version}/file-tree": customTree,
          "/.well-known/ucd-config.json": true,
        },
      });

      const customResponse = await fetch(
        "https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree",
      );
      const defaultResponse = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-config.json",
      );

      await expect(fetch("https://api.ucdjs.dev/api/v1/versions")).rejects.toThrow();
      expect(customResponse.ok).toBe(true);
      expect(defaultResponse.ok).toBe(true);

      const customData = await customResponse.json();
      expect(customData).toEqual(customTree);
    });
  });

  describe("configured responses", () => {
    it("should apply random latency", async () => {
      const testData: UnicodeVersionList = [{
        version: "test",
        documentationUrl: "https://unicode.org",
        date: null,
        url: "https://unicode.org",
        mappedUcdVersion: null,
        type: "draft",
      }];

      mockStoreApi({
        responses: {
          "/api/v1/versions": configure({
            response: testData,
            latency: "random",
          }),
        },
      });

      const start = Date.now();
      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const elapsed = Date.now() - start;

      expect(response.ok).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(95);
    });

    it("should combine latency and headers", async () => {
      const testData: UnicodeVersionList = [{
        version: "test",
        documentationUrl: "https://unicode.org",
        date: null,
        url: "https://unicode.org",
        mappedUcdVersion: null,
        type: "draft",
      }];

      mockStoreApi({
        responses: {
          "/api/v1/versions": configure({
            response: testData,
            latency: 50,
            headers: { "X-Test": "combined" },
          }),
        },
      });

      const start = Date.now();
      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const elapsed = Date.now() - start;

      expect(response.ok).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(response.headers.get("X-Test")).toBe("combined");
    });

    it("should work with configure() helper", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": configure({
            response: {
              message: "Bad request",
              status: 400,
              timestamp: "2024-01-01T00:00:00.000Z",
            },
          }),
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        message: "Bad request",
        status: 400,
        timestamp: "2024-01-01T00:00:00.000Z",
      });
    });

    it("should work with configure() helper and latency", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": configure({
            response: {
              message: "Service unavailable",
              status: 503,
              timestamp: "2024-01-01T00:00:00.000Z",
            },
            latency: 50,
          }),
        },
      });

      const start = Date.now();
      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const elapsed = Date.now() - start;
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(data.message).toBe("Service unavailable");
    });

    it("should work with configure() helper and custom headers", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": configure({
            response: {
              message: "Too many requests",
              status: 429,
              timestamp: "2024-01-01T00:00:00.000Z",
            },
            headers: {
              "X-Rate-Limit-Remaining": "0",
              "X-Rate-Limit-Reset": "1234567890",
            },
          }),
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.message).toBe("Too many requests");
      expect(response.headers.get("X-Rate-Limit-Remaining")).toBe("0");
      expect(response.headers.get("X-Rate-Limit-Reset")).toBe("1234567890");
    });

    it("should work with configure() helper and before/after hooks", async () => {
      const beforeHook = vi.fn();
      const afterHook = vi.fn();

      const version16 = {
        version: "16.0.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
        date: "2024",
        url: "https://www.unicode.org/Public/16.0.0",
        mappedUcdVersion: null,
        type: "stable",
      } as const;

      const version15 = {
        version: "15.1.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
        date: "2023",
        url: "https://www.unicode.org/Public/15.1.0",
        mappedUcdVersion: null,
        type: "stable",
      } as const;

      mockStoreApi({
        responses: {
          "/api/v1/versions": configure({
            response: [
              version16,
              version15,
            ],
            before: beforeHook,
            after: afterHook,
          }),
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const [v16, v15] = await response.json();

      expect(response.status).toBe(200);
      expect(v16).toEqual(version16);
      expect(v15).toEqual(version15);

      expect(beforeHook).toHaveBeenCalledTimes(1);
      expect(afterHook).toHaveBeenCalledTimes(1);
      expect(beforeHook).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/api/v1/versions",
          method: "GET",
        }),
      );
      expect(afterHook).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/api/v1/versions",
          method: "GET",
          response: expect.any(Response),
        }),
      );
    });

    it("should work with configure() helper, hooks, latency, and headers", async () => {
      const beforeHook = vi.fn();
      const afterHook = vi.fn();

      const version16 = {
        version: "16.0.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
        date: "2024",
        url: "https://www.unicode.org/Public/16.0.0",
        mappedUcdVersion: null,
        type: "stable",
      } as const;

      mockStoreApi({
        responses: {
          "/api/v1/versions": configure({
            response: [
              version16,
            ],
            latency: 50,
            headers: { "X-Custom": "value" },
            before: beforeHook,
            after: afterHook,
          }),
        },
      });

      const start = Date.now();
      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const elapsed = Date.now() - start;
      const [v16] = await response.json();

      expect(response.status).toBe(200);
      expect(v16).toEqual(version16);
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(response.headers.get("X-Custom")).toBe("value");
      expect(beforeHook).toHaveBeenCalledTimes(1);
      expect(afterHook).toHaveBeenCalledTimes(1);
    });

    it("should work with configure() hooks and default resolver using files option", async () => {
      const beforeHook = vi.fn();
      const afterHook = vi.fn();

      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [{
            type: "file",
            name: "test.txt",
            lastModified: Date.now(),
          }],
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": configure({
            response: true,
            before: beforeHook,
            after: afterHook,
          }),
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree",
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([{
        type: "file",
        name: "test.txt",
        path: "/16.0.0/ucd/test.txt",
        lastModified: expect.any(Number),
      }]);
      expect(beforeHook).toHaveBeenCalledTimes(1);
      expect(afterHook).toHaveBeenCalledTimes(1);
      expect(beforeHook).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/api/v1/versions/16.0.0/file-tree",
          method: "GET",
          params: { version: "16.0.0" },
        }),
      );
      expect(afterHook).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/api/v1/versions/16.0.0/file-tree",
          method: "GET",
          params: { version: "16.0.0" },
          response: expect.any(Response),
        }),
      );
    });
  });

  describe("custom baseUrl", () => {
    it("should work with all endpoints on custom baseUrl", async () => {
      const customBase = "https://my-api.ucdjs.dev";

      mockStoreApi({
        baseUrl: customBase,
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
          "/.well-known/ucd-store/{version}.json": true,
          "/.well-known/ucd-config.json": true,
        },
      });

      const urls = [
        `${customBase}/api/v1/versions`,
        `${customBase}/api/v1/versions/16.0.0/file-tree`,
        `${customBase}/api/v1/files/16.0.0/ucd/ArabicShaping.txt`,
        `${customBase}/.well-known/ucd-store/16.0.0.json`,
        `${customBase}/.well-known/ucd-config.json`,
      ];

      for (const url of urls) {
        const response = await fetch(url);
        expect(response.ok).toBe(true);
      }
    });
  });

  describe("customResponses", () => {
    it("should handle single custom GET endpoint", async () => {
      mockStoreApi({
        customResponses: [
          ["GET", "https://api.ucdjs.dev/api/v1/stats", () => {
            return HttpResponse.json({ totalVersions: 42 });
          }],
        ],
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/stats");
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toEqual({ totalVersions: 42 });
    });

    it("should handle multiple custom endpoints", async () => {
      mockStoreApi({
        customResponses: [
          ["GET", "https://api.ucdjs.dev/api/v1/health", () => {
            return HttpResponse.json({ status: "healthy" });
          }],
          ["GET", "https://api.ucdjs.dev/api/v1/metadata", () => {
            return HttpResponse.json({ lastUpdated: "2024-01-01" });
          }],
        ],
      });

      const response1 = await fetch("https://api.ucdjs.dev/api/v1/health");
      const response2 = await fetch("https://api.ucdjs.dev/api/v1/metadata");

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1).toEqual({ status: "healthy" });
      expect(data2).toEqual({ lastUpdated: "2024-01-01" });
    });

    it("should handle multiple HTTP methods on same endpoint", async () => {
      mockStoreApi({
        customResponses: [
          [["POST", "PUT"], "https://api.ucdjs.dev/api/v1/cache", ({ request }) => {
            return HttpResponse.json({ method: request.method });
          }],
        ],
      });

      const postResponse = await fetch("https://api.ucdjs.dev/api/v1/cache", {
        method: "POST",
      });
      const putResponse = await fetch("https://api.ucdjs.dev/api/v1/cache", {
        method: "PUT",
      });

      const postData = await postResponse.json();
      const putData = await putResponse.json();

      expect(postData).toEqual({ method: "POST" });
      expect(putData).toEqual({ method: "PUT" });
    });

    it("should access path parameters in custom resolver", async () => {
      mockStoreApi({
        customResponses: [
          ["GET", "https://api.ucdjs.dev/api/v1/versions/:version/stats", ({ params }) => {
            return HttpResponse.json({ version: params.version, downloads: 100 });
          }],
        ],
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions/16.0.0/stats");
      const data = await response.json();

      expect(data).toEqual({ version: "16.0.0", downloads: 100 });
    });

    it("should work alongside regular responses", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": [],
        },
        customResponses: [
          ["GET", "https://api.ucdjs.dev/api/v1/search", () => {
            return HttpResponse.json({ results: [] });
          }],
        ],
      });

      const regularResponse = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const customResponse = await fetch("https://api.ucdjs.dev/api/v1/search");

      expect(regularResponse.ok).toBe(true);
      expect(customResponse.ok).toBe(true);

      const customData = await customResponse.json();
      expect(customData).toEqual({ results: [] });
    });

    it("should handle custom responses with different content types", async () => {
      mockStoreApi({
        customResponses: [
          ["GET", "https://api.ucdjs.dev/api/v1/raw/readme.txt", () => {
            return HttpResponse.text("UCD Store Documentation", {
              headers: { "Content-Type": "text/plain" },
            });
          }],
          ["GET", "https://api.ucdjs.dev/api/v1/status", () => {
            return HttpResponse.json({ online: true });
          }],
        ],
      });

      const textResponse = await fetch("https://api.ucdjs.dev/api/v1/raw/readme.txt");
      const jsonResponse = await fetch("https://api.ucdjs.dev/api/v1/status");

      const text = await textResponse.text();
      const json = await jsonResponse.json();

      expect(text).toBe("UCD Store Documentation");
      expect(json).toEqual({ online: true });
    });

    it("should handle custom responses with status codes", async () => {
      mockStoreApi({
        customResponses: [
          ["GET", "https://api.ucdjs.dev/api/v1/versions/99.0.0", () => {
            return HttpResponse.json(
              { message: "Version not found", status: 404 },
              { status: 404 },
            );
          }],
          ["POST", "https://api.ucdjs.dev/api/v1/cache/invalidate", () => {
            return HttpResponse.json(
              { success: true },
              { status: 201 },
            );
          }],
        ],
      });

      const notFoundResponse = await fetch("https://api.ucdjs.dev/api/v1/versions/99.0.0");
      const createdResponse = await fetch("https://api.ucdjs.dev/api/v1/cache/invalidate", {
        method: "POST",
      });

      expect(notFoundResponse.status).toBe(404);
      expect(createdResponse.status).toBe(201);
    });

    it("should handle async custom responses", async () => {
      mockStoreApi({
        customResponses: [
          ["GET", "https://api.ucdjs.dev/api/v1/delayed", async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return HttpResponse.json({ delayed: true });
          }],
        ],
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/delayed");
      const data = await response.json();

      expect(data).toEqual({ delayed: true });
    });

    it("should handle empty customResponses array", () => {
      expect(() => {
        mockStoreApi({
          customResponses: [],
        });
      }).not.toThrow();
    });
  });

  describe("apiError auto-conversion", () => {
    it("should automatically convert ApiError-like response to error response", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": {
            message: "Version not found",
            status: 404,
            timestamp: "2024-01-01T00:00:00.000Z",
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        message: "Version not found",
        status: 404,
        timestamp: "2024-01-01T00:00:00.000Z",
      });
    });

    it("should still work with regular success responses", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": [
            {
              version: "16.0.0",
              documentationUrl: "https://unicode.org",
              date: null,
              url: "https://unicode.org",
              mappedUcdVersion: null,
              type: "stable" as const,
            },
          ],
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].version).toBe("16.0.0");
    });

    it("should handle ApiError on different endpoints", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions/{version}/file-tree": {
            message: "Version not found",
            status: 404,
            timestamp: "2024-01-01T00:00:00.000Z",
          },
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/versions/99.0.0/file-tree",
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe("Version not found");
    });
  });
});

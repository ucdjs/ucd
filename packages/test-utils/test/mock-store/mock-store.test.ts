import type { UCDWellKnownConfig, UnicodeTree, UnicodeVersionList } from "@ucdjs/schemas";
import { HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { configure, mockStoreApi } from "../../src/mock-store";

describe("mockStoreApi", () => {
  describe("basic setup", () => {
    it("should initialize with default configuration", () => {
      expect(() => mockStoreApi()).not.toThrow();
    });

    it("should initialize with custom baseUrl", () => {
      expect(() => mockStoreApi({ baseUrl: "https://custom.ucdjs.dev" })).not.toThrow();
    });

    it("should normalize baseUrl with trailing slash", async () => {
      mockStoreApi({ baseUrl: "https://api.luxass.dev/" });

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

  describe("endpoint: /api/v1/versions", () => {
    it("should return default versions list", async () => {
      mockStoreApi();

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveLength(3);
      expect(data[0]).toMatchObject({
        version: "16.0.0",
        type: "stable",
      });
    });

    it("should use custom versions in default response", async () => {
      mockStoreApi({
        versions: ["1.0.0", "2.0.0"],
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0].version).toBe("1.0.0");
      expect(data[1].version).toBe("2.0.0");
    });

    it("should accept custom response data", async () => {
      const customData = [
        {
          version: "custom",
          documentationUrl: "https://unicode.org",
          date: null,
          url: "https://unicode.org",
          mappedUcdVersion: null,
          type: "draft" as const,
        },
      ];

      mockStoreApi({
        responses: {
          "/api/v1/versions": customData,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(data).toEqual(customData);
    });

    it("should accept custom resolver function", async () => {
      const customVersion: UnicodeVersionList = [{
        version: "resolver",
        documentationUrl: "https://unicode.org",
        date: null,
        url: "https://unicode.org",
        mappedUcdVersion: null,
        type: "draft",
      }];

      mockStoreApi({
        responses: {
          "/api/v1/versions": vi.fn(async () => {
            return HttpResponse.json<UnicodeVersionList>(customVersion);
          }),
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(data).toEqual(customVersion);
    });

    it("should skip endpoint when set to false", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": false,
        },
      });

      await expect(fetch("https://api.ucdjs.dev/api/v1/versions")).rejects.toThrow();
    });

    it("should handle configured response with latency", async () => {
      const testData: UnicodeVersionList = [];

      mockStoreApi({
        responses: {
          "/api/v1/versions": configure({
            response: testData,
            latency: 50,
          }),
        },
      });

      const start = Date.now();
      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const elapsed = Date.now() - start;

      expect(response.ok).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it("should handle configured response with headers", async () => {
      const testData: UnicodeVersionList = [];

      mockStoreApi({
        responses: {
          "/api/v1/versions": configure({
            response: testData,
            headers: {
              "X-Custom-Header": "test-value",
            },
          }),
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");

      expect(response.headers.get("X-Custom-Header")).toBe("test-value");
    });
  });

  describe("endpoint: /api/v1/versions/{version}/file-tree", () => {
    it("should return default file tree", async () => {
      mockStoreApi();

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree",
      );
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toMatchObject({
        type: "file",
        name: "ArabicShaping.txt",
      });
    });

    it("should accept custom file tree data", async () => {
      const customTree = [
        {
          type: "file" as const,
          name: "custom.txt",
          path: "custom.txt",
          lastModified: 123456,
        },
      ];

      mockStoreApi({
        responses: {
          "/api/v1/versions/{version}/file-tree": customTree,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree",
      );
      const data = await response.json();

      expect(data).toEqual(customTree);
    });

    it("should accept custom resolver with path params", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions/{version}/file-tree": vi.fn(async ({ params }) => {
            const tree: UnicodeTree = [
              {
                type: "file",
                name: `test-${params.version}.txt`,
                path: `test-${params.version}.txt`,
              },
            ];

            return HttpResponse.json<UnicodeTree>(tree);
          }),
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/versions/1.0.0/file-tree",
      );
      const data = await response.json();

      expect(data[0].name).toBe("test-1.0.0.txt");
    });
  });

  describe("endpoint: /api/v1/files/{wildcard}", () => {
    it("should return default text content", async () => {
      mockStoreApi();

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/test.txt",
      );
      expect(response.ok).toBe(true);

      const text = await response.text();
      expect(text).toBe("Default file content");
    });

    it("should accept custom text content", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/files/{wildcard}": "custom content",
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/test.txt",
      );
      const text = await response.text();

      expect(text).toBe("custom content");
    });

    it("should accept binary content (ArrayBuffer)", async () => {
      const buffer = new Uint8Array([1, 2, 3, 4]).buffer;

      mockStoreApi({
        responses: {
          "/api/v1/files/{wildcard}": buffer,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/binary.dat",
      );
      const data = await response.arrayBuffer();

      expect(new Uint8Array(data)).toEqual(new Uint8Array([1, 2, 3, 4]));
    });

    it("should accept binary content (Uint8Array)", async () => {
      const uint8 = new Uint8Array([5, 6, 7, 8]);

      mockStoreApi({
        responses: {
          "/api/v1/files/{wildcard}": uint8,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/binary.dat",
      );
      const data = await response.arrayBuffer();

      expect(new Uint8Array(data)).toEqual(uint8);
    });

    it("should accept FileEntryList for directory listings", async () => {
      const fileList = [
        {
          type: "file" as const,
          name: "test.txt",
          path: "test.txt",
          lastModified: 123456,
        },
        {
          type: "directory" as const,
          name: "subdir",
          path: "subdir",
          lastModified: 123457,
        },
      ];

      mockStoreApi({
        responses: {
          "/api/v1/files/{wildcard}": fileList,
          "/api/v1/versions": true,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/directory/",
      );
      const data = await response.json();

      expect(data).toEqual(fileList);
    });

    it("should handle wildcard paths", async () => {
      mockStoreApi();

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/nested/deep/file.txt",
      );
      expect(response.ok).toBe(true);
    });
  });

  describe("endpoint: /.well-known/ucd-store.json", () => {
    it("should return default manifest", async () => {
      mockStoreApi();

      const response = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-store.json",
      );
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data["16.0.0"]).toEqual({ expectedFiles: [] });
      expect(data["15.1.0"]).toEqual({ expectedFiles: [] });
    });

    it("should use custom versions in manifest", async () => {
      mockStoreApi({
        versions: ["1.0.0", "2.0.0"],
      });

      const response = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-store.json",
      );
      const data = await response.json();

      expect(data["1.0.0"]).toEqual({ expectedFiles: [] });
      expect(data["2.0.0"]).toEqual({ expectedFiles: [] });
    });

    it("should accept custom manifest data", async () => {
      const customManifest = {
        custom: { expectedFiles: ["custom.txt"] },
      };

      mockStoreApi({
        responses: {
          "/.well-known/ucd-store.json": customManifest,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-store.json",
      );
      const data = await response.json();

      expect(data).toEqual(customManifest);
    });
  });

  describe("endpoint: /.well-known/ucd-config.json", () => {
    it("should return default config", async () => {
      mockStoreApi();

      const response = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-config.json",
      );
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toMatchObject({
        version: "0.1",
        endpoints: {
          files: "/api/v1/files",
          manifest: "/.well-known/ucd-store.json",
          versions: "/api/v1/versions",
        },
      });
    });

    it("should accept custom config data", async () => {
      const customConfig = {
        version: "1.0",
        endpoints: {
          files: "/custom/files",
          manifest: "/custom/manifest",
          versions: "/custom/versions",
        },
      };

      mockStoreApi({
        responses: {
          "/.well-known/ucd-config.json": customConfig,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-config.json",
      );
      const data = await response.json();

      expect(data).toEqual(customConfig);
    });
  });

  describe("mixed configurations", () => {
    it("should handle multiple custom endpoints", async () => {
      const customVersions: UnicodeVersionList = [];
      const customConfig: UCDWellKnownConfig = {
        version: "0.1",
        endpoints: {
          files: "/api/v1/files",
          manifest: "/.well-known/ucd-store.json",
          versions: "/api/v1/versions",
        },
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
      const customTree: UnicodeTree = [
        {
          type: "file",
          name: "custom.txt",
          path: "custom.txt",
        },
      ];

      mockStoreApi({
        responses: {
          "/api/v1/versions": false,
          "/api/v1/versions/{version}/file-tree": customTree,
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

    it("should apply multiple custom headers", async () => {
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
            headers: {
              "X-Header-1": "value1",
              "X-Header-2": "value2",
            },
          }),
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");

      expect(response.headers.get("X-Header-1")).toBe("value1");
      expect(response.headers.get("X-Header-2")).toBe("value2");
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
  });

  describe("custom baseUrl", () => {
    it("should work with custom baseUrl without trailing slash", async () => {
      mockStoreApi({
        baseUrl: "https://custom.ucdjs.dev",
      });

      const response = await fetch("https://custom.ucdjs.dev/api/v1/versions");
      expect(response.ok).toBe(true);
    });

    it("should work with custom baseUrl with trailing slash", async () => {
      mockStoreApi({
        baseUrl: "https://custom.ucdjs.dev/",
      });

      const response = await fetch("https://custom.ucdjs.dev/api/v1/versions");
      expect(response.ok).toBe(true);
    });

    it("should work with all endpoints on custom baseUrl", async () => {
      const customBase = "https://my-api.ucdjs.dev";

      mockStoreApi({
        baseUrl: customBase,
      });

      const urls = [
        `${customBase}/api/v1/versions`,
        `${customBase}/api/v1/versions/16.0.0/file-tree`,
        `${customBase}/api/v1/files/test.txt`,
        `${customBase}/.well-known/ucd-store.json`,
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

    it("should handle ApiError with 500 status code", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": {
            message: "Internal server error",
            status: 500,
            timestamp: "2024-01-01T00:00:00.000Z",
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe("Internal server error");
    });

    it("should handle ApiError with 401 status code", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": {
            message: "Unauthorized",
            status: 401,
            timestamp: "2024-01-01T00:00:00.000Z",
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
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

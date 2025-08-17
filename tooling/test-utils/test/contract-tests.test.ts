/**
 * Contract tests between setupMockStore and the actual API
 * These tests ensure that the mock store behaves consistently with the real API
 */

import { HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupMockStore } from "../src/store";
import { mockFetch } from "../src/msw";

// Mock the real API responses to test contract compliance
describe("setupMockStore contract tests", () => {
  beforeEach(() => {
    // Clear any existing handlers
    vi.clearAllMocks();
  });

  describe("/api/v1/versions endpoint", () => {
    it("should return same response structure as real API", async () => {
      // Setup mock store with default behavior
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      // Make request to the mocked endpoint
      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const mockData = await response.json();

      // Verify response structure matches expected API schema
      expect(Array.isArray(mockData)).toBe(true);
      expect(mockData.length).toBeGreaterThan(0);

      // Check that each version object has the expected structure
      for (const version of mockData) {
        expect(version).toHaveProperty("version");
        expect(version).toHaveProperty("documentationUrl");
        expect(version).toHaveProperty("date");
        expect(version).toHaveProperty("url");
        expect(version).toHaveProperty("mappedUcdVersion");
        expect(version).toHaveProperty("type");

        // Validate types
        expect(typeof version.version).toBe("string");
        expect(typeof version.documentationUrl).toBe("string");
        expect(version.date === null || typeof version.date === "string").toBe(true);
        expect(typeof version.url).toBe("string");
        expect(version.mappedUcdVersion === null || typeof version.mappedUcdVersion === "string").toBe(true);
        expect(["draft", "stable", "unsupported"]).toContain(version.type);
      }
    });

    it("should handle custom version responses", async () => {
      const customVersions = [
        {
          version: "16.0.0",
          documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
          date: "2024",
          url: "https://www.unicode.org/Public/16.0.0",
          mappedUcdVersion: null,
          type: "stable" as const,
        },
      ];

      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/versions": customVersions,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(data).toEqual(customVersions);
    });

    it("should respect response function overrides", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/versions": () => {
            return HttpResponse.json([
              {
                version: "test.0.0",
                documentationUrl: "https://example.com",
                date: "2024",
                url: "https://example.com/public",
                mappedUcdVersion: null,
                type: "draft",
              },
            ]);
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].version).toBe("test.0.0");
    });
  });

  describe("/api/v1/versions/:version/file-tree endpoint", () => {
    it("should return file tree structure matching API schema", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        versions: ["16.0.0", "15.1.0"],
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree");
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);

      // Check structure of file tree entries
      for (const entry of data) {
        expect(entry).toHaveProperty("type");
        expect(entry).toHaveProperty("name");
        expect(entry).toHaveProperty("path");
        expect(typeof entry.name).toBe("string");
        expect(typeof entry.path).toBe("string");
        expect(["file", "directory"]).toContain(entry.type);

        if (entry.type === "directory" && entry.children) {
          expect(Array.isArray(entry.children)).toBe(true);
        }

        if (entry.lastModified !== undefined) {
          expect(typeof entry.lastModified).toBe("number");
        }
      }
    });

    it("should handle custom file tree responses", async () => {
      const customFileTree = [
        {
          type: "file" as const,
          name: "test.txt",
          path: "test.txt",
          lastModified: 1234567890000,
        },
        {
          type: "directory" as const,
          name: "testdir",
          path: "testdir",
          children: [
            {
              type: "file" as const,
              name: "nested.txt",
              path: "nested.txt",
              lastModified: 1234567890000,
            },
          ],
        },
      ];

      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/versions/:version/file-tree": customFileTree,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree");
      const data = await response.json();

      expect(data).toEqual(customFileTree);
    });
  });

  describe("/api/v1/files/:wildcard endpoint", () => {
    it("should return text content by default", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/test.txt");
      const text = await response.text();

      expect(typeof text).toBe("string");
      expect(text).toBe("Default file content");
    });

    it("should handle custom string responses", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/files/:wildcard": "Custom file content",
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/test.txt");
      const text = await response.text();

      expect(text).toBe("Custom file content");
    });

    it("should handle binary data responses", async () => {
      const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
      
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/files/:wildcard": binaryData,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/test.bin");
      const buffer = await response.arrayBuffer();
      const resultArray = new Uint8Array(buffer);

      expect(resultArray).toEqual(binaryData);
      expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
    });

    it("should handle function responses with params", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/files/:wildcard": ({ request, params }) => {
            // Try params first, fall back to extracting from URL
            const wildcard = params?.wildcard || new URL(request.url).pathname.replace("/api/v1/files/", "");
            return HttpResponse.text(`Content of ${wildcard}`);
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/test.txt");
      const text = await response.text();

      expect(text).toBe("Content of test.txt");
    });
  });

  describe("/api/v1/files/.ucd-store.json endpoint", () => {
    it("should return store manifest structure", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/.ucd-store.json");
      const data = await response.json();

      expect(typeof data).toBe("object");
      expect(data["16.0.0"]).toBe("16.0.0");
      expect(data["15.1.0"]).toBe("15.1.0");
      expect(data["15.0.0"]).toBe("15.0.0");
    });

    it("should handle custom manifest responses", async () => {
      const customManifest = {
        "16.0.0": "16.0.0-custom",
        "15.1.0": "15.1.0-custom",
      };

      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/files/.ucd-store.json": customManifest,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/.ucd-store.json");
      const data = await response.json();

      expect(data).toEqual(customManifest);
    });
  });

  describe("response disabling", () => {
    it("should not handle disabled endpoints", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/versions": false,
        },
      });

      // Since the endpoint is disabled, this request should not be handled by MSW
      // and should result in a network error or unhandled request
      await expect(fetch("https://api.ucdjs.dev/api/v1/versions")).rejects.toThrow();
    });
  });

  describe("base URL handling", () => {
    it("should handle different base URLs", async () => {
      setupMockStore({
        baseUrl: "https://custom.api.example.com",
        versions: ["16.0.0"],
      });

      const response = await fetch("https://custom.api.example.com/api/v1/versions");
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it("should normalize trailing slashes in base URL", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev/",
        versions: ["16.0.0"],
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
    });
  });
});
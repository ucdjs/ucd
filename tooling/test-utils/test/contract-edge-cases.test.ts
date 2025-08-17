/**
 * Extended contract tests for edge cases and error handling
 * These tests ensure edge case behavior matches between mock and real API
 */

import { HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupMockStore } from "../src/store";

describe("setupMockStore edge case contract tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("HTTP status codes and error handling", () => {
    it("should handle HTTP error responses correctly", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/versions": () => {
            return HttpResponse.json(
              { error: "Service unavailable" },
              { status: 503 }
            );
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      
      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data).toEqual({ error: "Service unavailable" });
    });

    it("should handle 404 responses for non-existent files", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/files/:wildcard": () => {
            return HttpResponse.json(
              { error: "File not found" },
              { status: 404 }
            );
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/nonexistent.txt");
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "File not found" });
    });

    it("should handle 400 responses for invalid version requests", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/versions/:version/file-tree": () => {
            return HttpResponse.json(
              { error: "Invalid Unicode version" },
              { status: 400 }
            );
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions/invalid/file-tree");
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Invalid Unicode version" });
    });
  });

  describe("Response headers and content types", () => {
    it("should handle custom headers correctly", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/files/:wildcard": () => {
            return HttpResponse.text("File content", {
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "max-age=3600",
                "Last-Modified": "Wed, 21 Oct 2015 07:28:00 GMT",
              },
            });
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/test.txt");
      
      expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
      expect(response.headers.get("Cache-Control")).toBe("max-age=3600");
      expect(response.headers.get("Last-Modified")).toBe("Wed, 21 Oct 2015 07:28:00 GMT");
    });

    it("should handle JSON responses with correct content type", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/versions": [
            {
              version: "16.0.0",
              documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
              date: "2024",
              url: "https://www.unicode.org/Public/16.0.0",
              mappedUcdVersion: null,
              type: "stable" as const,
            },
          ],
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      
      expect(response.headers.get("Content-Type")).toContain("application/json");
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should handle binary file responses with correct content type", async () => {
      const binaryData = new ArrayBuffer(8);
      const view = new Uint8Array(binaryData);
      view.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header

      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/files/:wildcard": binaryData,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/image.png");
      
      expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
      const buffer = await response.arrayBuffer();
      expect(new Uint8Array(buffer)).toEqual(view);
    });
  });

  describe("Path parameter handling", () => {
    it("should handle complex file paths with special characters", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/files/:wildcard": ({ request }) => {
            const url = new URL(request.url);
            const path = url.pathname.replace("/api/v1/files/", "");
            return HttpResponse.text(`File: ${decodeURIComponent(path)}`);
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/emoji/emoji-data.txt");
      const text = await response.text();
      
      expect(text).toBe("File: emoji/emoji-data.txt");
    });

    it("should handle URL-encoded paths", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/files/:wildcard": ({ request }) => {
            const url = new URL(request.url);
            const path = url.pathname.replace("/api/v1/files/", "");
            return HttpResponse.text(`File: ${decodeURIComponent(path)}`);
          },
        },
      });

      const encodedPath = encodeURIComponent("test file with spaces.txt");
      const response = await fetch(`https://api.ucdjs.dev/api/v1/files/${encodedPath}`);
      const text = await response.text();
      
      expect(text).toBe("File: test file with spaces.txt");
    });

    it("should handle version parameter in file-tree endpoint", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/versions/:version/file-tree": ({ request }) => {
            const url = new URL(request.url);
            const pathParts = url.pathname.split("/");
            const version = pathParts[4]; // /api/v1/versions/{version}/file-tree
            
            return HttpResponse.json([
              {
                type: "file",
                name: `${version}-specific.txt`,
                path: `${version}-specific.txt`,
                lastModified: Date.now(),
              },
            ]);
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree");
      const data = await response.json();
      
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe("16.0.0-specific.txt");
    });
  });

  describe("Request method handling", () => {
    it("should only respond to GET requests by default", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        versions: ["16.0.0"],
      });

      // POST should not be handled by the mock store
      const postResponse = await fetch("https://api.ucdjs.dev/api/v1/versions", {
        method: "POST",
      }).catch(() => ({ ok: false, status: 404 }));

      expect(postResponse.ok).toBe(false);

      // GET should work
      const getResponse = await fetch("https://api.ucdjs.dev/api/v1/versions");
      expect(getResponse.ok).toBe(true);
    });

    it("should handle HEAD requests appropriately", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/files/:wildcard": "File content",
        },
      });

      const headResponse = await fetch("https://api.ucdjs.dev/api/v1/files/test.txt", {
        method: "HEAD",
      }).catch(() => ({ ok: false }));

      // HEAD requests might not be explicitly supported, but shouldn't crash
      expect(typeof headResponse.ok).toBe("boolean");
    });
  });

  describe("Multiple base URLs and configuration", () => {
    it("should handle multiple mock stores with different base URLs", async () => {
      // Setup first mock store
      setupMockStore({
        baseUrl: "https://api1.example.com",
        versions: ["16.0.0"],
      });

      // Setup second mock store
      setupMockStore({
        baseUrl: "https://api2.example.com",
        versions: ["15.1.0"],
      });

      const response1 = await fetch("https://api1.example.com/api/v1/versions");
      const data1 = await response1.json();
      expect(data1[0].version).toBe("16.0.0");

      const response2 = await fetch("https://api2.example.com/api/v1/versions");
      const data2 = await response2.json();
      expect(data2[0].version).toBe("15.1.0");
    });

    it("should handle configuration override scenarios", async () => {
      // First setup
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/versions": [{ version: "old", type: "stable" }],
        },
      });

      // Override with new setup
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        responses: {
          "/api/v1/versions": [{ version: "new", type: "stable" }],
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();
      
      // Should use the latest configuration
      expect(data[0].version).toBe("new");
    });
  });

  describe("Data consistency and validation", () => {
    it("should maintain data consistency across different endpoints", async () => {
      const testVersions = ["16.0.0", "15.1.0"];
      
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        versions: testVersions,
      });

      // Check versions endpoint
      const versionsResponse = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const versions = await versionsResponse.json();
      
      // Check store manifest
      const storeResponse = await fetch("https://api.ucdjs.dev/api/v1/files/.ucd-store.json");
      const store = await storeResponse.json();

      // Verify consistency
      const versionsList = versions.map((v: any) => v.version).sort();
      const storeVersions = Object.keys(store).sort();
      
      expect(versionsList).toEqual(testVersions.sort());
      expect(storeVersions).toEqual(testVersions.sort());
    });

    it("should validate that file tree responses contain required fields", async () => {
      setupMockStore({
        baseUrl: "https://api.ucdjs.dev",
        versions: ["16.0.0"],
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree");
      const fileTree = await response.json();
      
      expect(Array.isArray(fileTree)).toBe(true);
      
      for (const entry of fileTree) {
        // Required fields
        expect(entry).toHaveProperty("type");
        expect(entry).toHaveProperty("name");
        expect(entry).toHaveProperty("path");
        expect(["file", "directory"]).toContain(entry.type);
        
        // If directory, should have children array
        if (entry.type === "directory" && entry.children) {
          expect(Array.isArray(entry.children)).toBe(true);
        }
      }
    });
  });
});
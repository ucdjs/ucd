import { mockFetch } from "#msw-utils";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import HTTPFileSystemBridge from "../../src/fs-bridge/http";

describe("fs-bridge#http", () => {
  describe("read", () => {
    it("should read a file from HTTP endpoint", async () => {
      const fileContent = "Hello, World!";
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET", "https://api.ucdjs.dev/test.txt", () => {
          return new HttpResponse(fileContent, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const result = await bridge.read("/test.txt");
      expect(result).toBe(fileContent);
    });

    it("should throw error when file not found", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET", "https://api.ucdjs.dev/not-found.txt", () => {
          return new HttpResponse("Not Found", {
            status: 404,
            statusText: "Not Found",
          });
        }],
      ]);

      await expect(bridge.read("/not-found.txt")).rejects.toThrow("Failed to read remote file: Not Found");
    });

    it("should throw error on server error", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET", "https://api.ucdjs.dev/server-error.txt", () => {
          return new HttpResponse("Internal Server Error", {
            status: 500,
            statusText: "Internal Server Error",
          });
        }],
      ]);

      await expect(bridge.read("/server-error.txt")).rejects.toThrow("Failed to read remote file: Internal Server Error");
    });
  });

  describe("listdir", () => {
    it("should list directory contents", async () => {
      const mockFileTree = [
        {
          type: "file",
          name: "file1.txt",
          path: "/api/files/file1.txt",
        },
        {
          type: "file",
          name: "file2.js",
          path: "/api/files/file2.js",
        },
        {
          type: "directory",
          name: "subdirectory",
          path: "/api/files/subdirectory",
        },
      ];

      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET", "https://api.ucdjs.dev/api/files", () => {
          return new HttpResponse(JSON.stringify(mockFileTree), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const result = await bridge.listdir("/api/files");
      expect(result).toEqual([
        { name: "file1.txt", path: "/api/files/file1.txt", type: "file" },
        { name: "file2.js", path: "/api/files/file2.js", type: "file" },
        { name: "subdirectory", path: "/api/files/subdirectory", type: "directory" },
      ]);
    });

    it("should list directory with recursive parameter", async () => {
      const mockFileTree = [
        { type: "file", name: "file1.txt", path: "/api/files/file1.txt" },
        { type: "file", name: "file2.js", path: "/api/files/file2.js" },
        { type: "directory", name: "subdir", path: "/api/files/subdir", lastModified: "2023-01-01T00:00:00Z" },
      ];
      const subDirTree = [
        { type: "file", name: "nested.txt", path: "/api/files/subdir/nested.txt" },
      ];
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET", "https://api.ucdjs.dev/api/files", () => {
          return new HttpResponse(JSON.stringify(mockFileTree), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
        ["GET", "https://api.ucdjs.dev/api/files/subdir", () => {
          return new HttpResponse(JSON.stringify(subDirTree), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const result = await bridge.listdir("/api/files", true);
      expect(result).toEqual([
        { name: "file1.txt", path: "/api/files/file1.txt", type: "file" },
        { name: "file2.js", path: "/api/files/file2.js", type: "file" },
        { name: "subdir", path: "/api/files/subdir", type: "directory" },
        { name: "nested.txt", path: "/api/files/subdir/nested.txt", type: "file" },
      ]);
    });

    it("should throw error when directory listing fails", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET", "https://api.ucdjs.dev/api/not-found", () => {
          return new HttpResponse("Not Found", {
            status: 404,
            statusText: "Not Found",
          });
        }],
      ]);

      await expect(bridge.listdir("/api/not-found")).rejects.toThrow("Failed to list directory: Not Found");
    });

    it("should handle empty directory", async () => {
      const mockFileTree: unknown[] = [];
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET", "https://api.ucdjs.dev/api/empty", () => {
          return new HttpResponse(JSON.stringify(mockFileTree), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const result = await bridge.listdir("/api/empty");
      expect(result).toEqual([]);
    });
  });

  describe("exists", () => {
    it("should return true for existing file", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["HEAD", "https://api.ucdjs.dev/existing-file.txt", () => {
          return new HttpResponse(null, {
            status: 200,
          });
        }],
      ]);

      const result = await bridge.exists("/existing-file.txt");
      expect(result).toBe(true);
    });

    it("should return false for non-existing file", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["HEAD", "https://api.ucdjs.dev/non-existing.txt", () => {
          return new HttpResponse(null, {
            status: 404,
          });
        }],
      ]);

      const result = await bridge.exists("/non-existing.txt");
      expect(result).toBe(false);
    });

    it("should return false on network error", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["HEAD", "https://api.ucdjs.dev/network-error", () => {
          return HttpResponse.error();
        }],
      ]);

      const result = await bridge.exists("/network-error");
      expect(result).toBe(false);
    });
  });

  describe("read-only operations", () => {
    it("should not throw on write operation", async () => {
      const bridge = HTTPFileSystemBridge();

      // Write should not throw but also should not do anything
      await expect(bridge.write("/test.txt", "content")).resolves.toBeUndefined();
    });

    it("should not throw on mkdir operation", async () => {
      const bridge = HTTPFileSystemBridge();

      // mkdir should not throw but also should not do anything
      await expect(bridge.mkdir("/new-dir")).resolves.toBeUndefined();
    });

    it("should not throw on rm operation", async () => {
      const bridge = HTTPFileSystemBridge();

      // rm should not throw but also should not do anything
      await expect(bridge.rm("/file.txt")).resolves.toBeUndefined();
    });

    it("should return stat information", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });
      const mockStatData = {
        type: "file",
        mtime: "2023-01-01T00:00:00Z",
        size: 1024,
      };

      mockFetch([
        ["GET", "https://api.ucdjs.dev/__stat/file.txt", () => {
          return new HttpResponse(JSON.stringify(mockStatData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const result = await bridge.stat("/file.txt");
      expect(result.isFile()).toBe(true);
      expect(result.isDirectory()).toBe(false);
      expect(result.size).toBe(1024);
    });
  });

  describe("url handling", () => {
    it("should work without baseUrl", async () => {
      const bridge = HTTPFileSystemBridge();
      const fileContent = "No base URL content";

      mockFetch([
        ["GET", "https://cdn.ucdjs.dev/file.txt", () => {
          return new HttpResponse(fileContent, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const result = await bridge.read("https://cdn.ucdjs.dev/file.txt");
      expect(result).toBe(fileContent);
    });

    it("should resolve relative paths against baseUrl", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev/v1/" });
      const fileContent = "Relative path content";

      mockFetch([
        ["GET", "https://api.ucdjs.dev/v1/files/document.txt", () => {
          return new HttpResponse(fileContent, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const result = await bridge.read("files/document.txt");
      expect(result).toBe(fileContent);
    });

    it("should handle baseUrl with trailing slash", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev/" });
      const fileContent = "Trailing slash content";

      mockFetch([
        ["GET", "https://api.ucdjs.dev/file.txt", () => {
          return new HttpResponse(fileContent, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const result = await bridge.read("file.txt");
      expect(result).toBe(fileContent);
    });

    it("should handle baseUrl without trailing slash", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });
      const fileContent = "No trailing slash content";

      mockFetch([
        ["GET", "https://api.ucdjs.dev/file.txt", () => {
          return new HttpResponse(fileContent, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const result = await bridge.read("/file.txt");
      expect(result).toBe(fileContent);
    });
  });

  describe("error scenarios", () => {
    it("should handle malformed JSON in listdir", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET", "https://api.ucdjs.dev/api/malformed", () => {
          return new HttpResponse("invalid json", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.listdir("/api/malformed")).rejects.toThrow();
    });

    it("should handle invalid schema in listdir response", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET", "https://api.ucdjs.dev/api/invalid-schema", () => {
          return new HttpResponse(JSON.stringify([{ invalid: "data" }]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.listdir("/api/invalid-schema")).rejects.toThrow();
    });
  });
});

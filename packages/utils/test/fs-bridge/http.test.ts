import { mockFetch } from "#msw-utils";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import HTTPFileSystemBridge from "../../src/fs-bridge/http";

describe("httpFileSystemBridge", () => {
  describe("read", () => {
    it("should read a file from HTTP endpoint", async () => {
      const fileContent = "Hello, World!";
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET https://api.ucdjs.dev/test.txt", () => {
          return new HttpResponse(fileContent, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const result = await bridge.read("/test.txt");
      expect(result).toBe(fileContent);
    });

    it("should read a file with absolute URL", async () => {
      const fileContent = "Absolute URL content";
      const bridge = HTTPFileSystemBridge();

      mockFetch([
        ["GET https://files.ucdjs.dev/document.txt", () => {
          return new HttpResponse(fileContent, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const result = await bridge.read("https://files.ucdjs.dev/document.txt");
      expect(result).toBe(fileContent);
    });

    it("should throw error when file not found", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET https://api.ucdjs.dev/not-found.txt", () => {
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
        ["GET https://api.ucdjs.dev/server-error.txt", () => {
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
      const mockFileTree = {
        files: ["file1.txt", "file2.js", "subdirectory"],
      };
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET https://api.ucdjs.dev/api/files", () => {
          return new HttpResponse(JSON.stringify(mockFileTree), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const result = await bridge.listdir("/api/files");
      expect(result).toEqual(["file1.txt", "file2.js", "subdirectory"]);
    });

    it("should list directory with recursive parameter (ignored)", async () => {
      const mockFileTree = {
        files: ["file1.txt", "file2.js"],
      };
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET https://api.ucdjs.dev/api/files", () => {
          return new HttpResponse(JSON.stringify(mockFileTree), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const result = await bridge.listdir("/api/files", true);
      expect(result).toEqual(["file1.txt", "file2.js"]);
    });

    it("should throw error when directory listing fails", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET https://api.ucdjs.dev/api/not-found", () => {
          return new HttpResponse("Not Found", {
            status: 404,
            statusText: "Not Found",
          });
        }],
      ]);

      await expect(bridge.listdir("/api/not-found")).rejects.toThrow("Failed to list directory: Not Found");
    });

    it("should handle empty directory", async () => {
      const mockFileTree = {
        files: [],
      };
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET https://api.ucdjs.dev/api/empty", () => {
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
        ["HEAD https://api.ucdjs.dev/existing-file.txt", () => {
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
        ["HEAD https://api.ucdjs.dev/non-existing.txt", () => {
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
        ["HEAD https://api.ucdjs.dev/network-error.txt", () => {
          throw new Error("Network error");
        }],
      ]);

      const result = await bridge.exists("/network-error.txt");
      expect(result).toBe(false);
    });

    it("should work with absolute URLs", async () => {
      const bridge = HTTPFileSystemBridge();

      mockFetch([
        ["HEAD https://files.ucdjs.dev/check/file.txt", () => {
          return new HttpResponse(null, {
            status: 200,
          });
        }],
      ]);

      const result = await bridge.exists("https://files.ucdjs.dev/check/file.txt");
      expect(result).toBe(true);
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

    it("should throw error on stat operation", async () => {
      const bridge = HTTPFileSystemBridge();

      await expect(bridge.stat("/file.txt")).rejects.toThrow("Stat operation is not supported in HTTPFileSystemBridge");
    });
  });

  describe("url handling", () => {
    it("should work without baseUrl", async () => {
      const bridge = HTTPFileSystemBridge();
      const fileContent = "No base URL content";

      mockFetch([
        ["GET https://cdn.ucdjs.dev/file.txt", () => {
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
        ["GET https://api.ucdjs.dev/v1/files/document.txt", () => {
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
        ["GET https://api.ucdjs.dev/file.txt", () => {
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
        ["GET https://api.ucdjs.dev/file.txt", () => {
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
        ["GET https://api.ucdjs.dev/api/malformed", () => {
          return new HttpResponse("invalid json", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.listdir("/api/malformed")).rejects.toThrow();
    });

    it("should handle missing files property in listdir response", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" });

      mockFetch([
        ["GET https://api.ucdjs.dev/api/no-files", () => {
          return new HttpResponse(JSON.stringify({ data: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const result = await bridge.listdir("/api/no-files");
      expect(result).toBeUndefined();
    });
  });
});

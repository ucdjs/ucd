import HTTPFileSystemBridge from "#internal:bridge/http";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";

describe("http bridge - absolute pathname scenarios", () => {
  // Absolute pathname: deep pathname like "/api/v1/files/v16.0.0"
  const baseUrl = `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0`;

  describe("absolute pathname with relative input", () => {
    it("should resolve relative paths correctly", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0/file.txt`, () => {
          return new HttpResponse("content", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      const content = await bridge.read("file.txt");
      expect(content).toBe("content");
    });

    it("should resolve nested relative paths", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0/subdir/file.txt`, () => {
          return new HttpResponse("content", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      const content = await bridge.read("subdir/file.txt");
      expect(content).toBe("content");
    });

    it("should allow upward traversal within pathname", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0/file.txt`, () => {
          return new HttpResponse("root content", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      const content = await bridge.read("subdir/../file.txt");
      expect(content).toBe("root content");
    });
  });

  describe("absolute pathname with absolute input", () => {
    it("should treat absolute input as relative (virtual filesystem)", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0/file.txt`, () => {
          return new HttpResponse("content", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Absolute path should be treated as relative (virtual filesystem boundary)
      const content = await bridge.read("/file.txt");
      expect(content).toBe("content");
    });
  });

  describe("absolute pathname edge cases", () => {
    it("should handle root reference", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0`, () => {
          return new HttpResponse(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      const entries = await bridge.listdir("/");
      expect(entries).toEqual([]);
    });

    it("should handle current directory reference", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0`, () => {
          return new HttpResponse(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      const entries = await bridge.listdir(".");
      expect(entries).toEqual([]);
    });
  });

  describe("all bridge methods with absolute pathname", () => {
    it("should work with read", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0/file.txt`, () => {
          return new HttpResponse("content", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      const content = await bridge.read("file.txt");
      expect(content).toBe("content");
    });

    it("should work with exists", async () => {
      mockFetch([
        ["HEAD", `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0/file.txt`, () => {
          return new HttpResponse(null, { status: 200 });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      expect(await bridge.exists("file.txt")).toBe(true);
    });

    it("should work with listdir", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0`, () => {
          return new HttpResponse(JSON.stringify([
            { type: "file", name: "file1.txt", path: "file1.txt", lastModified: Date.now() },
            { type: "file", name: "file2.txt", path: "file2.txt", lastModified: Date.now() },
          ]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      const entries = await bridge.listdir("");
      expect(entries).toHaveLength(2);
    });
  });
});

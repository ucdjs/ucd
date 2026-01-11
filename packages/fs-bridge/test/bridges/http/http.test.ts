import type { FileEntry } from "@ucdjs/schemas";
import HTTPFileSystemBridge from "#internal:bridge/http";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { flattenFilePaths } from "@ucdjs-internal/shared";
import { UCDJS_STORE_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { assertCapability } from "../../../src";

describe("http fs-bridge", () => {
  const baseUrl = UCDJS_STORE_BASE_URL;
  const bridge = HTTPFileSystemBridge({ baseUrl });

  describe("read operation", () => {
    it("should read file content successfully", async () => {
      const fileContent = "Hello, World!";

      mockFetch([
        ["GET", `${baseUrl}/test-file.txt`, () => {
          return new HttpResponse(fileContent, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const content = await bridge.read("test-file.txt");
      expect(content).toBe(fileContent);
    });

    it("should read JSON file content", async () => {
      const jsonContent = { name: "test", version: "1.0.0" };

      mockFetch([
        ["GET", `${baseUrl}/config.json`, () => {
          return new HttpResponse(JSON.stringify(jsonContent), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const content = await bridge.read("config.json");
      expect(content).toBe(JSON.stringify(jsonContent));
    });

    it("should throw error for non-existent file", async () => {
      mockFetch([
        ["GET", `${baseUrl}/missing.txt`, () => {
          return new HttpResponse("Not Found", {
            status: 404,
            statusText: "Not Found",
          });
        }],
      ]);

      await expect(bridge.read("missing.txt")).rejects.toThrow("Failed to read remote file: Not Found");
    });

    it("should throw error for server error", async () => {
      mockFetch([
        ["GET", `${baseUrl}/error.txt`, () => {
          return new HttpResponse("Internal Server Error", {
            status: 500,
            statusText: "Internal Server Error",
          });
        }],
      ]);

      await expect(bridge.read("error.txt")).rejects.toThrow("Failed to read remote file: Internal Server Error");
    });
  });

  describe("exists operation", () => {
    it("should return true for existing file", async () => {
      mockFetch([
        ["HEAD", `${baseUrl}/exists.txt`, () => {
          return new HttpResponse(null, { status: 200 });
        }],
      ]);

      const exists = await bridge.exists("exists.txt");
      expect(exists).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      mockFetch([
        ["HEAD", `${baseUrl}/missing.txt`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const exists = await bridge.exists("missing.txt");
      expect(exists).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch([
        ["HEAD", `${baseUrl}/network-error.txt`, () => {
          return Response.error();
        }],
      ]);

      const exists = await bridge.exists("network-error.txt");
      expect(exists).toBe(false);
    });

    it("should return false for server error", async () => {
      mockFetch([
        ["HEAD", `${baseUrl}/server-error.txt`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const exists = await bridge.exists("server-error.txt");
      expect(exists).toBe(false);
    });
  });

  describe("listdir operation", () => {
    const mockDirectoryData = [
      {
        type: "file" as const,
        name: "file1.txt",
        path: "/file1.txt",
        lastModified: Date.now(),
      },
      {
        type: "file" as const,
        name: "file2.txt",
        path: "/file2.txt",
        lastModified: Date.now(),
      },
      {
        type: "directory" as const,
        name: "subdir",
        path: "/subdir/",
        lastModified: Date.now(),
      },
    ] satisfies FileEntry[];

    it("should list directory contents", async () => {
      mockFetch([
        ["GET", `${baseUrl}/test-dir`, () => {
          return new HttpResponse(JSON.stringify(mockDirectoryData), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
          });
        }],
      ]);

      const files = await bridge.listdir("test-dir");
      expect(files).toEqual([
        {
          name: "file1.txt",
          path: "/file1.txt",
          type: "file",
        },
        {
          name: "file2.txt",
          path: "/file2.txt",
          type: "file",
        },
        {
          children: [],
          name: "subdir",
          path: "/subdir/",
          type: "directory",
        },

      ]);
    });

    it("should list directory contents recursively", async () => {
      const subdirData = [
        {
          type: "file" as const,
          name: "nested.txt",
          path: "/subdir/nested.txt",
          lastModified: Date.now(),
        },
      ] satisfies FileEntry[];

      mockFetch([
        ["GET", `${baseUrl}/dir`, () => {
          return new HttpResponse(JSON.stringify(mockDirectoryData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
        ["GET", `${baseUrl}/dir/subdir`, () => {
          return new HttpResponse(JSON.stringify(subdirData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const files = await bridge.listdir("dir", true);
      expect(files).toEqual([
        { type: "file", name: "file1.txt", path: "/file1.txt" },
        { type: "file", name: "file2.txt", path: "/file2.txt" },
        {
          type: "directory",
          name: "subdir",
          path: "/subdir/",
          children: [
            { type: "file", name: "nested.txt", path: "/subdir/nested.txt" },
          ],
        },
      ]);
    });

    it("should handle empty directory", async () => {
      mockFetch([
        ["GET", `${baseUrl}/empty-dir`, () => {
          return new HttpResponse(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const files = await bridge.listdir("empty-dir");
      expect(files).toEqual([]);
    });

    it("should return empty array for non-existent directory", async () => {
      mockFetch([
        ["GET", `${baseUrl}/missing-dir`, () => {
          return new HttpResponse("Directory not found", {
            status: 404,
            statusText: "Not Found",
          });
        }],
      ]);

      const files = await bridge.listdir("missing-dir");
      expect(files).toEqual([]);
    });

    it("should handle invalid JSON response", async () => {
      mockFetch([
        ["GET", `${baseUrl}/invalid-json`, () => {
          return new HttpResponse("invalid json", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.listdir("invalid-json")).rejects.toThrow();
    });

    it("should skip inaccessible subdirectories in recursive mode", async () => {
      mockFetch([
        ["GET", `${baseUrl}/dir`, () => {
          return new HttpResponse(JSON.stringify([
            {
              type: "file" as const,
              name: "accessible.txt",
              path: "/accessible.txt",
              lastModified: Date.now(),
            },
            {
              type: "directory" as const,
              name: "inaccessible",
              path: "/inaccessible/",
              lastModified: Date.now(),
            },
          ] satisfies FileEntry[]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
        ["GET", `${baseUrl}/dir/inaccessible`, () => {
          return new HttpResponse("Forbidden", {
            status: 403,
            statusText: "Forbidden",
          });
        }],
        ["GET", `${baseUrl}/dir/inaccessible/another-file.txt`, () => {
          return new HttpResponse("This should not be accessible", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const files = await bridge.listdir("dir", true);
      expect(files).toEqual([
        { type: "file", name: "accessible.txt", path: "/accessible.txt" },
        { type: "directory", name: "inaccessible", path: "/inaccessible/", children: [] },
      ]);
      expect(flattenFilePaths(files)).not.toContain("/inaccessible/another-file.txt");
    });
  });

  describe("capability system", () => {
    it("should correctly infer read-only capabilities", () => {
      expect(bridge.optionalCapabilities).toEqual({
        write: false,
        mkdir: false,
        rm: false,
      });
    });

    it("should fail write capability assertions", () => {
      expect(() => assertCapability(bridge, "write")).toThrow("File system bridge does not support the 'write' capability.");
      expect(() => assertCapability(bridge, "mkdir")).toThrow("File system bridge does not support the 'mkdir' capability.");
      expect(() => assertCapability(bridge, "rm")).toThrow("File system bridge does not support the 'rm' capability.");

      expect(() => assertCapability(bridge, ["write"])).toThrow("File system bridge does not support the 'write' capability.");
      expect(() => assertCapability(bridge, ["mkdir", "write"])).toThrow("File system bridge does not support the 'mkdir' capability.");
    });
  });

  describe("unsupported operations", () => {
    it("should throw error for unsupported write operation with optional chaining", async () => {
      await expect(() => bridge.write?.("test.txt", "content")).rejects.toThrowError(
        "File system bridge does not support the 'write' capability.",
      );
    });

    it("should throw error for unsupported mkdir operation with optional chaining", async () => {
      await expect(() => bridge.mkdir?.("new-dir")).rejects.toThrowError(
        "File system bridge does not support the 'mkdir' capability.",
      );
    });

    it("should throw error for unsupported rm operation with optional chaining", async () => {
      await expect(() => bridge.rm?.("test.txt")).rejects.toThrowError(
        "File system bridge does not support the 'rm' capability.",
      );
    });

    it("should throw error when calling unsupported operations directly without optional chaining", async () => {
      // Direct calls (without ?) should also throw due to proxy
      await expect(() => (bridge as any).write("test.txt", "content")).rejects.toThrow(
        "File system bridge does not support the 'write' capability.",
      );
      await expect(() => (bridge as any).mkdir("new-dir")).rejects.toThrow(
        "File system bridge does not support the 'mkdir' capability.",
      );
      await expect(() => (bridge as any).rm("test.txt")).rejects.toThrow(
        "File system bridge does not support the 'rm' capability.",
      );
    });

    it("should distinguish between capability assertion and proxy errors", async () => {
      // Capability assertion error
      try {
        assertCapability(bridge, "write");
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.name).toBe("BridgeUnsupportedOperation");
        expect(error.message).toBe("File system bridge does not support the 'write' capability.");
        expect(error.capability).toBe("write");
      }

      // Proxy error (same message but different error type)
      try {
        await bridge.write?.("test.txt", "content");
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.name).toBe("BridgeUnsupportedOperation");
        expect(error.message).toBe("File system bridge does not support the 'write' capability.");
        expect(error.capability).toBe("write");
      }
    });
  });

  describe("url handling", () => {
    it("should handle relative paths correctly", async () => {
      const content = "relative path content";

      mockFetch([
        ["GET", `${baseUrl}/path/to/file.txt`, () => {
          return new HttpResponse(content, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const result = await bridge.read("path/to/file.txt");
      expect(result).toBe(content);
    });

    it("should handle absolute paths correctly", async () => {
      const content = "absolute path content";

      mockFetch([
        ["GET", `${baseUrl}/absolute/path.txt`, () => {
          return new HttpResponse(content, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const result = await bridge.read("/absolute/path.txt");
      expect(result).toBe(content);
    });
  });

  describe("complex workflows", () => {
    it("should handle file discovery workflow", async () => {
      // list directory to find files
      const directoryData = [
        {
          type: "file" as const,
          name: "config.json",
          path: "/config/config.json",
          lastModified: Date.now(),
        },
        {
          type: "file" as const,
          name: "readme.md",
          path: "/config/readme.md",
          lastModified: Date.now(),
        },
      ] satisfies FileEntry[];

      const configContent = "{\"version\": \"1.0.0\", \"name\": \"test-app\"}";

      mockFetch([
        ["GET", `${baseUrl}/config`, () => {
          return new HttpResponse(JSON.stringify(directoryData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
        ["HEAD", `${baseUrl}/config/config.json`, () => {
          return new HttpResponse(null, { status: 200 });
        }],
        ["GET", `${baseUrl}/config/config.json`, () => {
          return new HttpResponse(configContent, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      // discover files
      const files = await bridge.listdir("config");
      expect(files).toEqual([
        { type: "file", name: "config.json", path: "/config/config.json" },
        { type: "file", name: "readme.md", path: "/config/readme.md" },
      ]);

      // check if config exists
      const configExists = await bridge.exists("config/config.json");
      expect(configExists).toBe(true);

      // read config file
      const config = await bridge.read("config/config.json");
      expect(JSON.parse(config)).toEqual({ version: "1.0.0", name: "test-app" });
    });

    it("should handle concurrent operations", async () => {
      const file1Content = "Content of file 1";
      const file2Content = "Content of file 2";
      const file3Content = "Content of file 3";

      mockFetch([
        ["GET", `${baseUrl}/file1.txt`, () => {
          return new HttpResponse(file1Content, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
        ["GET", `${baseUrl}/file2.txt`, () => {
          return new HttpResponse(file2Content, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
        ["GET", `${baseUrl}/file3.txt`, () => {
          return new HttpResponse(file3Content, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const [content1, content2, content3] = await Promise.all([
        bridge.read("file1.txt"),
        bridge.read("file2.txt"),
        bridge.read("file3.txt"),
      ]);

      expect(content1).toBe(file1Content);
      expect(content2).toBe(file2Content);
      expect(content3).toBe(file3Content);
    });

    it("should handle mixed success and error responses", async () => {
      const successContent = "Success content";

      mockFetch([
        ["GET", `${baseUrl}/success.txt`, () => {
          return new HttpResponse(successContent, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
        ["HEAD", `${baseUrl}/exists.txt`, () => {
          return new HttpResponse(null, { status: 200 });
        }],
        ["HEAD", `${baseUrl}/missing.txt`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const [content, existsTrue, existsFalse] = await Promise.all([
        bridge.read("success.txt"),
        bridge.exists("exists.txt"),
        bridge.exists("missing.txt"),
      ]);

      expect(content).toBe(successContent);
      expect(existsTrue).toBe(true);
      expect(existsFalse).toBe(false);
    });
  });

  describe("schema validation (Zod)", () => {
    it("should reject listdir response with missing 'type' field", async () => {
      mockFetch([
        ["GET", `${baseUrl}/invalid-type`, () => {
          return new HttpResponse(JSON.stringify([
            {
              // missing 'type' field
              name: "file.txt",
              path: "/file.txt",
              lastModified: Date.now(),
            },
          ]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.listdir("invalid-type")).rejects.toThrow("Invalid response schema");
    });

    it("should reject listdir response with missing 'name' field", async () => {
      mockFetch([
        ["GET", `${baseUrl}/missing-name`, () => {
          return new HttpResponse(JSON.stringify([
            {
              type: "file",
              // missing 'name' field
              path: "/file.txt",
              lastModified: Date.now(),
            },
          ]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.listdir("missing-name")).rejects.toThrow("Invalid response schema");
    });

    it("should reject listdir response with missing 'path' field", async () => {
      mockFetch([
        ["GET", `${baseUrl}/missing-path`, () => {
          return new HttpResponse(JSON.stringify([
            {
              type: "file",
              name: "file.txt",
              // missing 'path' field
              lastModified: Date.now(),
            },
          ]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.listdir("missing-path")).rejects.toThrow("Invalid response schema");
    });

    it("should reject listdir response with invalid 'type' value", async () => {
      mockFetch([
        ["GET", `${baseUrl}/wrong-type`, () => {
          return new HttpResponse(JSON.stringify([
            {
              type: "symlink", // invalid type - should be "file" or "directory"
              name: "link.txt",
              path: "/link.txt",
              lastModified: Date.now(),
            },
          ]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.listdir("wrong-type")).rejects.toThrow("Invalid response schema");
    });

    it("should reject listdir response with non-string 'name'", async () => {
      mockFetch([
        ["GET", `${baseUrl}/number-name`, () => {
          return new HttpResponse(JSON.stringify([
            {
              type: "file",
              name: 12345, // should be string
              path: "/file.txt",
              lastModified: Date.now(),
            },
          ]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.listdir("number-name")).rejects.toThrow("Invalid response schema");
    });

    it("should reject listdir response with non-array payload", async () => {
      mockFetch([
        ["GET", `${baseUrl}/not-array`, () => {
          return new HttpResponse(JSON.stringify({
            type: "file",
            name: "file.txt",
            path: "/file.txt",
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.listdir("not-array")).rejects.toThrow("Invalid response schema");
    });

    it("should reject listdir response with null payload", async () => {
      mockFetch([
        ["GET", `${baseUrl}/null-payload`, () => {
          return new HttpResponse("null", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.listdir("null-payload")).rejects.toThrow("Invalid response schema");
    });
  });

  describe("fetch error handling", () => {
    it("should throw on network error for read operation", async () => {
      mockFetch([
        ["GET", `${baseUrl}/network-error.txt`, () => {
          return Response.error();
        }],
      ]);

      await expect(bridge.read("network-error.txt")).rejects.toThrow();
    });

    it("should throw on network error for listdir operation", async () => {
      mockFetch([
        ["GET", `${baseUrl}/network-error-dir`, () => {
          return Response.error();
        }],
      ]);

      await expect(bridge.listdir("network-error-dir")).rejects.toThrow();
    });

    it("should handle server error (500) for listdir", async () => {
      mockFetch([
        ["GET", `${baseUrl}/server-error-dir`, () => {
          return new HttpResponse("Internal Server Error", {
            status: 500,
            statusText: "Internal Server Error",
          });
        }],
      ]);

      await expect(bridge.listdir("server-error-dir")).rejects.toThrow("Server error while listing directory");
    });

    it("should return empty array for 403 forbidden on listdir", async () => {
      mockFetch([
        ["GET", `${baseUrl}/forbidden-dir`, () => {
          return new HttpResponse("Forbidden", {
            status: 403,
            statusText: "Forbidden",
          });
        }],
      ]);

      const entries = await bridge.listdir("forbidden-dir");
      expect(entries).toEqual([]);
    });
  });

  describe("content handling", () => {
    it("should return text content regardless of Content-Type header for read", async () => {
      // Even if server returns application/json Content-Type, read() returns text
      const jsonContent = "{\"key\": \"value\"}";

      mockFetch([
        ["GET", `${baseUrl}/data.json`, () => {
          return new HttpResponse(jsonContent, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const content = await bridge.read("data.json");
      // Should return raw text, not parsed JSON
      expect(content).toBe(jsonContent);
      expect(typeof content).toBe("string");
    });

    it("should handle binary-ish content returned as text", async () => {
      const binaryLikeContent = "Some content with special chars: \x00\x01\x02";

      mockFetch([
        ["GET", `${baseUrl}/binary-like.bin`, () => {
          return new HttpResponse(binaryLikeContent, {
            status: 200,
            headers: { "Content-Type": "application/octet-stream" },
          });
        }],
      ]);

      const content = await bridge.read("binary-like.bin");
      expect(typeof content).toBe("string");
    });

    it("should handle empty response body for read", async () => {
      mockFetch([
        ["GET", `${baseUrl}/empty.txt`, () => {
          return new HttpResponse("", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const content = await bridge.read("empty.txt");
      expect(content).toBe("");
    });

    it("should handle very large response for read", async () => {
      const largeContent = "x".repeat(1024 * 1024); // 1MB of 'x'

      mockFetch([
        ["GET", `${baseUrl}/large.txt`, () => {
          return new HttpResponse(largeContent, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const content = await bridge.read("large.txt");
      expect(content.length).toBe(1024 * 1024);
    });
  });
});

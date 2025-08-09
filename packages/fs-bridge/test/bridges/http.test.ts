import type { FileEntry } from "@ucdjs/schemas";
import { HttpResponse, mockFetch } from "@ucdjs/test-utils-internal/msw";
import { flattenFilePaths } from "@ucdjs/utils";
import { describe, expect, it } from "vitest";
import { assertCapability } from "../../src";
import HTTPFileSystemBridge from "../../src/bridges/http";

describe("http fs-bridge", () => {
  const baseUrl = "https://test-api.example.com";
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

      assertCapability(bridge, "read");
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

      assertCapability(bridge, "read");
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

      assertCapability(bridge, "read");
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

      assertCapability(bridge, "read");
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

      assertCapability(bridge, "exists");
      const exists = await bridge.exists("exists.txt");
      expect(exists).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      mockFetch([
        ["HEAD", `${baseUrl}/missing.txt`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      assertCapability(bridge, "exists");
      const exists = await bridge.exists("missing.txt");
      expect(exists).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch([
        ["HEAD", `${baseUrl}/network-error.txt`, () => {
          return Response.error();
        }],
      ]);

      assertCapability(bridge, "exists");
      const exists = await bridge.exists("network-error.txt");
      expect(exists).toBe(false);
    });

    it("should return false for server error", async () => {
      mockFetch([
        ["HEAD", `${baseUrl}/server-error.txt`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      assertCapability(bridge, "exists");
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
        path: "/subdir",
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

      assertCapability(bridge, "listdir");
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
          path: "/subdir",
          type: "directory",
        },

      ]);
    });

    it("should list directory contents recursively", async () => {
      const subdirData = [
        {
          type: "file" as const,
          name: "nested.txt",
          path: "/nested.txt",
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

      assertCapability(bridge, "listdir");
      const files = await bridge.listdir("dir", true);
      expect(files).toEqual([
        { type: "file", name: "file1.txt", path: "/file1.txt" },
        { type: "file", name: "file2.txt", path: "/file2.txt" },
        {
          type: "directory",
          name: "subdir",
          path: "/subdir",
          children: [
            { type: "file", name: "nested.txt", path: "/nested.txt" },
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

      assertCapability(bridge, "listdir");
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

      assertCapability(bridge, "listdir");
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

      assertCapability(bridge, "listdir");
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
              path: "/inaccessible",
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

      assertCapability(bridge, "listdir");
      const files = await bridge.listdir("dir", true);
      expect(files).toEqual([
        { type: "file", name: "accessible.txt", path: "/accessible.txt" },
        { type: "directory", name: "inaccessible", path: "/inaccessible", children: [] },
      ]);
      expect(flattenFilePaths(files)).not.toContain("/inaccessible/another-file.txt");
    });
  });

  describe("capability system", () => {
    it("should correctly infer read-only capabilities", () => {
      expect(bridge.capabilities).toEqual({
        read: true,
        exists: true,
        listdir: true,
        write: false,
        mkdir: false,
        rm: false,
      });
    });

    it("should pass read-only capability assertions", () => {
      expect(() => assertCapability(bridge, "read")).not.toThrow();
      expect(() => assertCapability(bridge, "exists")).not.toThrow();
      expect(() => assertCapability(bridge, "listdir")).not.toThrow();
      expect(() => assertCapability(bridge, ["read", "exists"])).not.toThrow();
      expect(() => assertCapability(bridge, ["read", "exists", "listdir"])).not.toThrow();
    });

    it("should fail write capability assertions", () => {
      expect(() => assertCapability(bridge, "write")).toThrow("File system bridge does not support the 'write' capability.");
      expect(() => assertCapability(bridge, "mkdir")).toThrow("File system bridge does not support the 'mkdir' capability.");
      expect(() => assertCapability(bridge, "rm")).toThrow("File system bridge does not support the 'rm' capability.");

      expect(() => assertCapability(bridge, ["read", "write"])).toThrow("File system bridge does not support the 'write' capability.");
      expect(() => assertCapability(bridge, ["exists", "mkdir"])).toThrow("File system bridge does not support the 'mkdir' capability.");
    });

    it("should allow read operations without optional chaining after assertion", async () => {
      const content = "test content";

      mockFetch([
        ["GET", `${baseUrl}/test.txt`, () => {
          return new HttpResponse(content, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
        ["HEAD", `${baseUrl}/test.txt`, () => {
          return new HttpResponse(null, { status: 200 });
        }],
        ["GET", `${baseUrl}/dir`, () => {
          return new HttpResponse(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      // assert read capabilities
      assertCapability(bridge, ["read", "exists", "listdir"]);

      // now we can call methods directly without ?.
      await expect(bridge.read("test.txt")).resolves.toBe(content);
      await expect(bridge.exists("test.txt")).resolves.toBe(true);
      await expect(bridge.listdir("dir")).resolves.toEqual([]);
    });

    it("should work with optional chaining for supported operations", async () => {
      const content = "test content";

      mockFetch([
        ["GET", `${baseUrl}/test.txt`, () => {
          return new HttpResponse(content, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
        ["HEAD", `${baseUrl}/test.txt`, () => {
          return new HttpResponse(null, { status: 200 });
        }],
        ["GET", `${baseUrl}/dir`, () => {
          return new HttpResponse(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await expect(bridge.read?.("test.txt")).resolves.toBe(content);
      await expect(bridge.exists?.("test.txt")).resolves.toBe(true);
      await expect(bridge.listdir?.("dir")).resolves.toEqual([]);
    });
  });

  describe("unsupported operations", () => {
    it("should throw error for unsupported write operation with optional chaining", () => {
      expect(() => bridge.write?.("test.txt", "content")).toThrowError(
        "File system bridge does not support the 'write' capability.",
      );
    });

    it("should throw error for unsupported mkdir operation with optional chaining", () => {
      expect(() => bridge.mkdir?.("new-dir")).toThrowError(
        "File system bridge does not support the 'mkdir' capability.",
      );
    });

    it("should throw error for unsupported rm operation with optional chaining", () => {
      expect(() => bridge.rm?.("test.txt")).toThrowError(
        "File system bridge does not support the 'rm' capability.",
      );
    });

    it("should throw error when calling unsupported operations directly without optional chaining", () => {
      // Direct calls (without ?) should also throw due to proxy
      expect(() => (bridge as any).write("test.txt", "content")).toThrow(
        "File system bridge does not support the 'write' capability.",
      );
      expect(() => (bridge as any).mkdir("new-dir")).toThrow(
        "File system bridge does not support the 'mkdir' capability.",
      );
      expect(() => (bridge as any).rm("test.txt")).toThrow(
        "File system bridge does not support the 'rm' capability.",
      );
    });

    it("should distinguish between capability assertion and proxy errors", () => {
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
        bridge.write?.("test.txt", "content");
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
      assertCapability(bridge, "read");

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

      assertCapability(bridge, "read");

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

      assertCapability(bridge, [
        "read",
        "exists",
        "listdir",
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

      assertCapability(bridge, [
        "read",
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

      assertCapability(bridge, [
        "read",
        "exists",
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
});

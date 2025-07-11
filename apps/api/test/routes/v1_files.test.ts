import type { EntryWithChildren } from "apache-autoindex-parse/traverse";
import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import {
  createExecutionContext,
  env,
  fetchMock,
  waitOnExecutionContext,
} from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import worker from "../../src";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => fetchMock.assertNoPendingInterceptors());

describe("v1_files", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/files/{version}", () => {
    const files = [
      { type: "file", name: "file1.txt", path: "/Public/15.1.0/ucd/file1.txt" },
      { type: "file", name: "file2.txt", path: "/Public/15.1.0/ucd/file2.txt" },
      { type: "directory", name: "subdir", path: "/Public/15.1.0/ucd/subdir/" },
      { type: "file", name: "subdir/file3.txt", path: "/Public/15.1.0/ucd/subdir/file3.txt" },
      { type: "file", name: "emoji-data.txt", path: "/Public/15.1.0/ucd/emoji/emoji-data.txt" },
    ] as EntryWithChildren[];

    it("should return files for a valid Unicode version", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd" })
        .reply(200, generateAutoIndexHtml(files, "F2"));

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json() as unknown[];
      expect(Array.isArray(data)).toBe(true);

      const expectedFiles = files.map((file) => {
        return expect.objectContaining({
          name: file.name,
          path: file.path,
          type: file.type,
          ...(file.children ? { children: file.children } : {}),
        });
      });

      expect(data).toEqual(expect.arrayContaining(expectedFiles));
    });

    it.todo("should return files for latest version", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/latest");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return 400 for invalid Unicode version", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/99.99.99");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Invalid Unicode version");
      expect(error).toHaveProperty("status", 400);
    });

    it("should return 400 for malformed version string", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/invalid-version");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Invalid Unicode version");
      expect(error).toHaveProperty("status", 400);
    });

    it("should handle empty version parameter", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      // Should return 404 since the route pattern doesn't match
      expect(response.status).toBe(404);
    });

    it("should set proper cache headers", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      // Check that cache headers are set (from the cache middleware)
      expect(response.headers.get("cache-control")).toBeTruthy();
    });

    it("should handle query parameters gracefully", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0?exclude=test&includeTests=false");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return structured file data with proper schema", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json() as unknown[];

      // Validate the response structure
      expect(Array.isArray(data)).toBe(true);

      // Check that each file object has the required properties
      data.forEach((file: any) => {
        expect(file).toHaveProperty("name");
        expect(file).toHaveProperty("path");
        expect(typeof file.name).toBe("string");
        expect(typeof file.path).toBe("string");

        // If it has children, they should also follow the schema
        if (file.children) {
          expect(Array.isArray(file.children)).toBe(true);
          file.children.forEach((child: any) => {
            expect(child).toHaveProperty("name");
            expect(child).toHaveProperty("path");
            expect(typeof child.name).toBe("string");
            expect(typeof child.path).toBe("string");
          });
        }
      });
    });

    it("should handle older Unicode versions", async () => {
      // Note: Older versions don't have /ucd path
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/3.1-Update1" })
        .reply(200, generateAutoIndexHtml(files, "F2"));

      const request = new Request("https://api.ucdjs.dev/api/v1/files/3.1.1");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("route not found", () => {
    it("should return 404 for non-existent routes", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/nonexistent/route");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
    });

    // HONO doesn't send the 405 response for wrong HTTP methods
    it.todo("should return 404 for wrong HTTP method", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0", {
        method: "POST",
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(405); // Method Not Allowed
    });
  });
});

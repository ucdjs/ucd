import { UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import {
  createExecutionContext,
  env,
  fetchMock,
  waitOnExecutionContext,
} from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import worker from "../../src/worker";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
});

describe("v1_files", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/files/:wildcard", () => {
    it("should route specific file path successfully", async () => {
      const mockFileContent = "# Unicode Character Database\n# Version 15.1.0\n";

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd/UnicodeData.txt?F=2" })
        .reply(200, mockFileContent, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "content-length": mockFileContent.length.toString(),
          },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData.txt");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
      expect(response.headers.get("cache-control")).toMatch(/max-age=\d+/);

      const content = await response.text();
      expect(content).toBe(mockFileContent);
    });

    it("should reject paths with '..' segments", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/..%2Ftest");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Invalid path");
      expect(error).toHaveProperty("status", 400);
    });

    it("should reject paths with '//' segments", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/path//with//double//slashes");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Invalid path");
      expect(error).toHaveProperty("status", 400);
    });

    it("should handle 404 from files endpoint", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/nonexistent/path?F=2" })
        .reply(404, "Not Found");

      const request = new Request("https://api.ucdjs.dev/api/v1/files/nonexistent/path");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Resource not found");
      expect(error).toHaveProperty("status", 404);
    });

    it("should handle 502 from unicode.org", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/error/path?F=2" })
        .reply(500, "Internal Server Error");

      const request = new Request("https://api.ucdjs.dev/api/v1/files/error/path");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(502);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Bad Gateway");
      expect(error).toHaveProperty("status", 502);
    });

    it("should handle missing content-type header", async () => {
      const mockContent = "Some binary content";

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/binary/file?F=2" })
        .reply(200, mockContent, {
          headers: {
            "content-length": mockContent.length.toString(),
          },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/binary/file");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/octet-stream");
      expect(response.headers.get("cache-control")).toMatch(/max-age=\d+/);
    });

    it("should infer content-type from .txt when upstream omits it", async () => {
      const mockContent = "Plain text content";

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/sample/file.txt?F=2" })
        .reply(200, mockContent, {
          headers: {
            "content-length": mockContent.length.toString(),
          },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/sample/file.txt");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/plain");
      expect(response.headers.get("cache-control")).toMatch(/max-age=\d+/);

      const content = await response.text();
      expect(content).toBe(mockContent);
    });

    it("should infer content-type from .xml when upstream omits it", async () => {
      const mockContent = "<root></root>";

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/sample/file.xml?F=2" })
        .reply(200, mockContent, {
          headers: {
            "content-length": mockContent.length.toString(),
          },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/sample/file.xml");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/xml");
      expect(response.headers.get("cache-control")).toMatch(/max-age=\d+/);

      const content = await response.text();
      expect(content).toBe(mockContent);
    });

    it("should correctly extract extension from paths with dots in directory names", async () => {
      const mockContent = "Unicode data content";

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd/UnicodeData?F=2" })
        .reply(200, mockContent, {
          headers: {
            "content-length": mockContent.length.toString(),
          },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/octet-stream");
      expect(response.headers.get("cache-control")).toMatch(/max-age=\d+/);

      const content = await response.text();
      expect(content).toBe(mockContent);
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("HEAD /api/v1/files/:wildcard", () => {
    it("should return headers for a specific file path", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd/UnicodeData.txt?F=2" })
        .reply(200, "", {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "content-length": "1234",
            "last-modified": "Wed, 01 Jan 2020 00:00:00 GMT",
          },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData.txt", {
        method: "HEAD",
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
      expect(response.headers.get("content-length")).toBe("1234");
      expect(response.headers.get("last-modified")).toBe("Wed, 01 Jan 2020 00:00:00 GMT");
      expect(response.headers.get(UCD_FILE_STAT_TYPE_HEADER)).toBe("file");
    });
  });

  it("should handle HEAD requests with specific file path", async () => {
    const mockFileContent = "# Unicode Character Database\n# Version 15.1.0\n";

    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public/15.1.0/ucd/UnicodeData.txt?F=2" })
      .reply(200, mockFileContent, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "content-length": mockFileContent.length.toString(),
        },
      });

    const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData.txt", {
      method: "HEAD",
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("cache-control")).toMatch(/max-age=\d+/);
  });

  it("should handle HEAD requests for directories", async () => {
    const html = generateAutoIndexHtml([
      { name: "UnicodeData.txt", path: "/Public/15.1.0/ucd/UnicodeData.txt", type: "file", lastModified: Date.now() },
      { name: "Blocks.txt", path: "/Public/15.1.0/ucd/Blocks.txt", type: "file", lastModified: Date.now() },
    ], "F2");

    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public/15.1.0/ucd?F=2" })
      .reply(200, html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "content-length": html.length.toString(),
        },
      });

    const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd", {
      method: "HEAD",
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("cache-control")).toMatch(/max-age=\d+/);
    expect(response.headers.get(UCD_FILE_STAT_TYPE_HEADER)).toBe("directory");
    expect(response.headers.get("content-length")).toBeDefined();
    expect(response.headers.get("last-modified")).toBeDefined();
  });

  it("should handle HEAD requests with invalid paths", async () => {
    const request = new Request("https://api.ucdjs.dev/api/v1/files/..%2Ftest", {
      method: "HEAD",
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
  });

  it("should handle HEAD requests with '//' segments", async () => {
    const request = new Request("https://api.ucdjs.dev/api/v1/files/path//with//double//slashes", {
      method: "HEAD",
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
  });

  it("should handle HEAD requests for non-existent files", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public/nonexistent/path?F=2" })
      .reply(404, "Not Found");

    const request = new Request("https://api.ucdjs.dev/api/v1/files/nonexistent/path", {
      method: "HEAD",
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(404);
  });

  it("should handle HEAD requests with 502 from unicode.org", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public/error/path?F=2" })
      .reply(500, "Internal Server Error");

    const request = new Request("https://api.ucdjs.dev/api/v1/files/error/path", {
      method: "HEAD",
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(502);
  });

  it("should handle HEAD requests with missing content-type header", async () => {
    const mockContent = "Some binary content";

    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public/binary/file?F=2" })
      .reply(200, mockContent, {
        headers: {
          "content-length": mockContent.length.toString(),
        },
      });

    const request = new Request("https://api.ucdjs.dev/api/v1/files/binary/file", {
      method: "HEAD",
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/octet-stream");
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/files/:wildcard with pattern filter", () => {
    it("should filter directory listing by glob pattern *.txt", async () => {
      const html = generateAutoIndexHtml([
        { name: "UnicodeData.txt", path: "/Public/15.1.0/ucd/UnicodeData.txt", type: "file", lastModified: Date.now() },
        { name: "Blocks.txt", path: "/Public/15.1.0/ucd/Blocks.txt", type: "file", lastModified: Date.now() },
        { name: "emoji", path: "/Public/15.1.0/ucd/emoji", type: "directory", lastModified: Date.now() },
        { name: "data.xml", path: "/Public/15.1.0/ucd/data.xml", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=*.txt");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const files = await response.json<{ name: string }[]>();
      expect(files).toHaveLength(2);
      expect(files.map((f) => f.name)).toEqual(["UnicodeData.txt", "Blocks.txt"]);
    });

    it("should filter directory listing by prefix pattern Uni*", async () => {
      const html = generateAutoIndexHtml([
        { name: "UnicodeData.txt", path: "/Public/15.1.0/ucd/UnicodeData.txt", type: "file", lastModified: Date.now() },
        { name: "Unihan.zip", path: "/Public/15.1.0/ucd/Unihan.zip", type: "file", lastModified: Date.now() },
        { name: "Blocks.txt", path: "/Public/15.1.0/ucd/Blocks.txt", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=Uni*");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const files = await response.json<{ name: string }[]>();
      expect(files).toHaveLength(2);
      expect(files.map((f) => f.name)).toEqual(["UnicodeData.txt", "Unihan.zip"]);
    });

    it("should filter case-insensitively", async () => {
      const html = generateAutoIndexHtml([
        { name: "UnicodeData.txt", path: "/Public/15.1.0/ucd/UnicodeData.txt", type: "file", lastModified: Date.now() },
        { name: "Blocks.txt", path: "/Public/15.1.0/ucd/Blocks.txt", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=unicode*");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const files = await response.json<{ name: string }[]>();
      expect(files).toHaveLength(1);
      expect(files[0]!.name).toBe("UnicodeData.txt");
    });

    it("should return empty array when no matches", async () => {
      const html = generateAutoIndexHtml([
        { name: "UnicodeData.txt", path: "/Public/15.1.0/ucd/UnicodeData.txt", type: "file", lastModified: Date.now() },
        { name: "Blocks.txt", path: "/Public/15.1.0/ucd/Blocks.txt", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=*.xml");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const files = await response.json<{ name: string }[]>();
      expect(files).toEqual([]);
    });

    it("should support multi-extension pattern *.{txt,xml}", async () => {
      const html = generateAutoIndexHtml([
        { name: "UnicodeData.txt", path: "/Public/15.1.0/ucd/UnicodeData.txt", type: "file", lastModified: Date.now() },
        { name: "ucd.all.flat.xml", path: "/Public/15.1.0/ucd/ucd.all.flat.xml", type: "file", lastModified: Date.now() },
        { name: "Unihan.zip", path: "/Public/15.1.0/ucd/Unihan.zip", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=*.{txt,xml}");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const files = await response.json<{ name: string }[]>();
      expect(files).toHaveLength(2);
      expect(files.map((f) => f.name)).toEqual(["UnicodeData.txt", "ucd.all.flat.xml"]);
    });

    it("should support substring pattern *Data*", async () => {
      const html = generateAutoIndexHtml([
        { name: "UnicodeData.txt", path: "/Public/15.1.0/ucd/UnicodeData.txt", type: "file", lastModified: Date.now() },
        { name: "emoji-data.txt", path: "/Public/15.1.0/ucd/emoji-data.txt", type: "file", lastModified: Date.now() },
        { name: "Blocks.txt", path: "/Public/15.1.0/ucd/Blocks.txt", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=*Data*");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const files = await response.json<{ name: string }[]>();
      expect(files).toHaveLength(2);
      expect(files.map((f) => f.name)).toEqual(["UnicodeData.txt", "emoji-data.txt"]);
    });

    it("should not apply pattern filter for file requests", async () => {
      const mockFileContent = "# Unicode Character Database";

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd/UnicodeData.txt?F=2" })
        .reply(200, mockFileContent, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData.txt?pattern=*.xml");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
      const content = await response.text();
      expect(content).toBe(mockFileContent);
    });

    it("should return 200 for empty pattern", async () => {
      const html = generateAutoIndexHtml([
        { name: "UnicodeData.txt", path: "/Public/15.1.0/ucd/UnicodeData.txt", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toEqual([
        {
          lastModified: expect.any(Number),
          name: "UnicodeData.txt",
          path: "/Public/15.1.0/ucd/UnicodeData.txt",
          type: "file",
        },
      ]);
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/files/search", () => {
    it("should search files by prefix and return files first", async () => {
      const html = generateAutoIndexHtml([
        { name: "come", path: "/Public/come", type: "directory", lastModified: Date.now() },
        { name: "computer.txt", path: "/Public/computer.txt", type: "file", lastModified: Date.now() },
        { name: "other.txt", path: "/Public/other.txt", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/search?q=com");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const results = await response.json<{ name: string; type: string }[]>();

      expect(results).toHaveLength(2);
      // Files should come before directories
      expect(results[0]).toMatchObject({ name: "computer.txt", type: "file" });
      expect(results[1]).toMatchObject({ name: "come", type: "directory" });
    });

    it("should search case-insensitively", async () => {
      const html = generateAutoIndexHtml([
        { name: "UnicodeData.txt", path: "/Public/UnicodeData.txt", type: "file", lastModified: Date.now() },
        { name: "Blocks.txt", path: "/Public/Blocks.txt", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/search?q=unicode");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const results = await response.json<{ name: string; type: string }[]>();

      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe("UnicodeData.txt");
    });

    it("should search within a specific path", async () => {
      const html = generateAutoIndexHtml([
        { name: "emoji-data.txt", path: "/Public/15.1.0/ucd/emoji/emoji-data.txt", type: "file", lastModified: Date.now() },
        { name: "emoji-sequences.txt", path: "/Public/15.1.0/ucd/emoji/emoji-sequences.txt", type: "file", lastModified: Date.now() },
        { name: "other.txt", path: "/Public/15.1.0/ucd/emoji/other.txt", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd/emoji?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/search?q=emoji&path=15.1.0/ucd/emoji");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const results = await response.json<{ name: string; type: string }[]>();

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(["emoji-data.txt", "emoji-sequences.txt"]);
    });

    it("should return empty array when no matches found", async () => {
      const html = generateAutoIndexHtml([
        { name: "UnicodeData.txt", path: "/Public/UnicodeData.txt", type: "file", lastModified: Date.now() },
        { name: "Blocks.txt", path: "/Public/Blocks.txt", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/search?q=nonexistent");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const results = await response.json();
      expect(results).toEqual([]);
    });

    it("should return empty array when path does not exist", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/nonexistent/path?F=2" })
        .reply(404, "Not Found");

      const request = new Request("https://api.ucdjs.dev/api/v1/files/search?q=test&path=nonexistent/path");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const results = await response.json();
      expect(results).toEqual([]);
    });

    it("should reject invalid path with '..'", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/search?q=test&path=../etc");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty("message", "Invalid path");
    });

    it("should reject invalid path with '//'", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/search?q=test&path=path//double");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty("message", "Invalid path");
    });

    it("should return 400 when q parameter is missing", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/files/search");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
    });

    it("should match exact directory name when query matches exactly", async () => {
      const html = generateAutoIndexHtml([
        { name: "come", path: "/Public/come", type: "directory", lastModified: Date.now() },
        { name: "computer.txt", path: "/Public/computer.txt", type: "file", lastModified: Date.now() },
      ], "F2");

      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public?F=2" })
        .reply(200, html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      const request = new Request("https://api.ucdjs.dev/api/v1/files/search?q=come");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const results = await response.json<{ name: string; type: string }[]>();

      // Only the directory matches exactly
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ name: "come", type: "directory" });
    });
  });
});

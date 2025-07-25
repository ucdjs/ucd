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
      expect(response.headers.get("cache-control")).toBe("max-age=3600");

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
      expect(response.headers.get("cache-control")).toBe("max-age=3600");
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
    expect(response.headers.get("cache-control")).toBe("max-age=3600");
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
    expect(response.headers.get("cache-control")).toBe("max-age=3600");
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
});

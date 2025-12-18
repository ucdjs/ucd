import { UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import { env, fetchMock } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { executeRequest } from "../helpers/request";
import { expectApiError, expectCacheHeaders, expectContentType, expectSuccess } from "../helpers/response";

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

      const { response, text } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData.txt"),
        env,
      );

      expectSuccess(response);
      expectContentType(response, "text/plain; charset=utf-8");
      expectCacheHeaders(response);

      const content = await text();
      expect(content).toBe(mockFileContent);
    });

    it("should reject paths with '..' segments", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/..%2Ftest"),
        env,
      );

      await expectApiError(response, { status: 400, message: "Invalid path" });
    });

    it("should reject paths with '//' segments", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/path//with//double//slashes"),
        env,
      );

      await expectApiError(response, { status: 400, message: "Invalid path" });
    });

    it("should handle 404 from files endpoint", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/nonexistent/path?F=2" })
        .reply(404, "Not Found");

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/nonexistent/path"),
        env,
      );

      await expectApiError(response, { status: 404, message: "Resource not found" });
    });

    it("should handle 502 from unicode.org", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/error/path?F=2" })
        .reply(500, "Internal Server Error");

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/error/path"),
        env,
      );

      await expectApiError(response, { status: 502, message: "Bad Gateway" });
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

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/binary/file"),
        env,
      );

      expectSuccess(response);
      expectContentType(response, "application/octet-stream");
      expectCacheHeaders(response);
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

      const { response, text } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/sample/file.txt"),
        env,
      );

      expectSuccess(response);
      expectContentType(response, "text/plain");
      expectCacheHeaders(response);

      const content = await text();
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

      const { response, text } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/sample/file.xml"),
        env,
      );

      expectSuccess(response);
      expectContentType(response, "application/xml");
      expectCacheHeaders(response);

      const content = await text();
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

      const { response, text } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData"),
        env,
      );

      expectSuccess(response);
      expectContentType(response, "application/octet-stream");
      expectCacheHeaders(response);

      const content = await text();
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

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData.txt", {
          method: "HEAD",
        }),
        env,
      );

      expectSuccess(response, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "content-length": "1234",
          "last-modified": "Wed, 01 Jan 2020 00:00:00 GMT",
          [UCD_FILE_STAT_TYPE_HEADER]: "file",
        },
      });
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

    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData.txt", {
        method: "HEAD",
      }),
      env,
    );

    expectSuccess(response);
    expectContentType(response, "text/plain; charset=utf-8");
    expectCacheHeaders(response);
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

    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd", {
        method: "HEAD",
      }),
      env,
    );

    expectSuccess(response);
    expectContentType(response, "application/json");
    expectCacheHeaders(response);
    expect(response.headers.get(UCD_FILE_STAT_TYPE_HEADER)).toBe("directory");
    expect(response.headers.get("content-length")).toBeDefined();
    expect(response.headers.get("last-modified")).toBeDefined();
  });

  it("should handle HEAD requests with invalid paths", async () => {
    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/..%2Ftest", {
        method: "HEAD",
      }),
      env,
    );

    await expectApiError(response, { status: 400 });
  });

  it("should handle HEAD requests with '//' segments", async () => {
    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/path//with//double//slashes", {
        method: "HEAD",
      }),
      env,
    );

    await expectApiError(response, { status: 400 });
  });

  it("should handle HEAD requests for non-existent files", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public/nonexistent/path?F=2" })
      .reply(404, "Not Found");

    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/nonexistent/path", {
        method: "HEAD",
      }),
      env,
    );

    await expectApiError(response, { status: 404 });
  });

  it("should handle HEAD requests with 502 from unicode.org", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public/error/path?F=2" })
      .reply(500, "Internal Server Error");

    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/error/path", {
        method: "HEAD",
      }),
      env,
    );

    await expectApiError(response, { status: 502 });
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

    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/binary/file", {
        method: "HEAD",
      }),
      env,
    );

    expectSuccess(response);
    expectContentType(response, "application/octet-stream");
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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=*.txt"),
        env,
      );

      expectSuccess(response);
      const files = await json() as { name: string }[];
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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=Uni*"),
        env,
      );

      expectSuccess(response);
      const files = await json() as { name: string }[];
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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=unicode*"),
        env,
      );

      expectSuccess(response);
      const files = await json() as { name: string }[];
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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=*.xml"),
        env,
      );

      expectSuccess(response);
      const files = await json() as { name: string }[];
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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=*.{txt,xml}"),
        env,
      );

      expectSuccess(response);
      const files = await json() as { name: string }[];
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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern=*Data*"),
        env,
      );

      expectSuccess(response);
      const files = await json() as { name: string }[];
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

      const { response, text } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData.txt?pattern=*.xml"),
        env,
      );

      expectSuccess(response);
      expectContentType(response, "text/plain; charset=utf-8");
      const content = await text();
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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd?pattern="),
        env,
      );

      expectSuccess(response);
      const result = await json();
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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/search?q=com"),
        env,
      );

      expectSuccess(response);
      const results = await json() as { name: string; type: string }[];

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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/search?q=unicode"),
        env,
      );

      expectSuccess(response);
      const results = await json() as { name: string; type: string }[];

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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/search?q=emoji&path=15.1.0/ucd/emoji"),
        env,
      );

      expectSuccess(response);
      const results = await json() as { name: string; type: string }[];

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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/search?q=nonexistent"),
        env,
      );

      expectSuccess(response);
      const results = await json();
      expect(results).toEqual([]);
    });

    it("should return empty array when path does not exist", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/nonexistent/path?F=2" })
        .reply(404, "Not Found");

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/search?q=test&path=nonexistent/path"),
        env,
      );

      expectSuccess(response);
      const results = await json();
      expect(results).toEqual([]);
    });

    it("should reject invalid path with '..'", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/search?q=test&path=../etc"),
        env,
      );

      await expectApiError(response, { status: 400, message: "Invalid path" });
    });

    it("should reject invalid path with '//'", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/search?q=test&path=path//double"),
        env,
      );

      await expectApiError(response, { status: 400, message: "Invalid path" });
    });

    it("should return 400 when q parameter is missing", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/search"),
        env,
      );

      await expectApiError(response, { status: 400 });
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

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/search?q=come"),
        env,
      );

      expectSuccess(response);
      const results = await json() as { name: string; type: string }[];

      // Only the directory matches exactly
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ name: "come", type: "directory" });
    });
  });
});

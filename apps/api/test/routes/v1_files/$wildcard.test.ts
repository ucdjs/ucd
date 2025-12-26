import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";
import {
  expectApiError,
  expectCacheHeaders,
  expectContentType,
  expectHeadError,
  expectSuccess,
} from "../../helpers/response";

describe("v1_files", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/files/:wildcard", () => {
    it("should route specific file path successfully", async () => {
      const mockFileContent = "# Unicode Character Database\n# Version 15.1.0\n";

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd/UnicodeData.txt", () => {
          return HttpResponse.text(mockFileContent, {
            headers: {
              "content-type": "text/plain; charset=utf-8",
              "content-length": mockFileContent.length.toString(),
            },
          });
        }],
      ]);

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
      mockFetch([
        ["GET", "https://unicode.org/Public/nonexistent/path?F=2", () => {
          return new Response("Not Found", { status: 404 });
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/nonexistent/path"),
        env,
      );

      await expectApiError(response, { status: 404, message: "Resource not found" });
    });

    it("should handle 502 from unicode.org", async () => {
      mockFetch([
        ["GET", "https://unicode.org/Public/error/path", () => {
          return new Response("Bad Gateway", { status: 502 });
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/error/path"),
        env,
      );

      await expectApiError(response, { status: 502, message: "Bad Gateway" });
    });

    it("should handle missing content-type header", async () => {
      const mockContent = "Some binary content";

      mockFetch([
        ["GET", "https://unicode.org/Public/binary/file", () => {
          return new Response(mockContent, {
            status: 200,
            headers: {
              "content-length": mockContent.length.toString(),
            },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/sample/file.txt", () => {
          return new Response(mockContent, {
            status: 200,
            headers: {
              "content-length": mockContent.length.toString(),
            },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/sample/file.xml", () => {
          return new Response(mockContent, {
            headers: {
              "content-length": mockContent.length.toString(),
            },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd/UnicodeData.txt", () => {
          return new Response(mockContent, {
            headers: {
              "content-type": "text/plain; charset=utf-8",
              "content-length": mockContent.length.toString(),
            },
          });
        }],
      ]);

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
      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd/UnicodeData.txt", () => {
          return HttpResponse.text("", {
            headers: {
              "content-type": "text/plain; charset=utf-8",
              "content-length": "1234",
              "last-modified": "Wed, 01 Jan 2020 00:00:00 GMT",
            },
          });
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData.txt"),
        env,
      );
      expectSuccess(response);
      expectContentType(response, "text/plain; charset=utf-8");
      expectCacheHeaders(response);
    });
  });

  it("should handle HEAD requests with specific file path", async () => {
    const mockFileContent = "# Unicode Character Database\n# Version 15.1.0\n";

    mockFetch([
      ["GET", "https://unicode.org/Public/15.1.0/ucd/UnicodeData.txt", () => {
        return HttpResponse.text(mockFileContent, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "content-length": mockFileContent.length.toString(),
          },
        });
      }],
    ]);

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

    mockFetch([
      ["GET", "https://unicode.org/Public/15.1.0/ucd", () => {
        return HttpResponse.text(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "content-length": html.length.toString(),
          },
        });
      }],
    ]);

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

    expectHeadError(response, 400);
  });

  it("should handle HEAD requests with '//' segments", async () => {
    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/path//with//double//slashes", {
        method: "HEAD",
      }),
      env,
    );

    expectHeadError(response, 400);
  });

  it("should handle HEAD requests for non-existent files", async () => {
    mockFetch([
      ["GET", "https://unicode.org/Public/nonexistent/path", () => {
        return HttpResponse.text("Not Found", { status: 404 });
      }],
    ]);

    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/nonexistent/path", {
        method: "HEAD",
      }),
      env,
    );

    expectHeadError(response, 404);
  });

  it("should handle HEAD requests with 502 from unicode.org", async () => {
    mockFetch([
      ["GET", "https://unicode.org/Public/error/path", () => {
        return HttpResponse.text("Internal Server Error", {
          status: 500,
        });
      }],
    ]);

    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/error/path", {
        method: "HEAD",
      }),
      env,
    );

    expectHeadError(response, 502);
  });

  it("should handle HEAD requests with missing content-type header", async () => {
    const mockContent = "Some binary content";

    mockFetch([
      ["GET", "https://unicode.org/Public/binary/file", () => {
        return new Response(mockContent, {
          headers: {
            "content-length": mockContent.length.toString(),
          },
        });
      }],
    ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd/UnicodeData.txt", () => {
          return HttpResponse.text(mockFileContent, {
            status: 200,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd", () => {
          return HttpResponse.text(html, {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

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
});

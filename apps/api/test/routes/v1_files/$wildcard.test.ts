/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import type { FileEntryList } from "@ucdjs/schemas";
import { HttpResponse, mockFetch, RawResponse } from "#test-utils/msw";
import { UCD_STAT_SIZE_HEADER, UCD_STAT_TYPE_HEADER } from "@ucdjs/env";
import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";

describe("v1_files", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/files/:wildcard", () => {
    describe("successful file requests", () => {
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

        expect(response).toMatchResponse({
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
          cache: true,
        });

        const content = await text();
        expect(content).toBe(mockFileContent);
      });

      it("should not forward content-length for streamed GET responses", async () => {
        const mockFileContent = "Plain text content";

        mockFetch([
          ["GET", "https://unicode.org/Public/15.1.0/ucd/ReadMe.txt", () => {
            return HttpResponse.text(mockFileContent, {
              headers: {
                "content-type": "text/plain; charset=utf-8",
                "content-length": mockFileContent.length.toString(),
              },
            });
          }],
        ]);

        const { response, text } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/ReadMe.txt"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
          cache: true,
        });

        expect(response.headers.has("Content-Length")).toBe(false);
        expect(response.headers.has(UCD_STAT_SIZE_HEADER)).toBe(false);

        const content = await text();
        expect(content).toBe(mockFileContent);
      });
    });

    describe("path validation", () => {
      it("should reject paths with '..' segments", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files/..%2Ftest"),
          env,
        );

        expect(response).toBeApiError({
          status: 400,
          message: "Invalid path",
        });
      });

      it("should reject paths with '//' segments", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files/path//with//double//slashes"),
          env,
        );

        expect(response).toBeApiError({
          status: 400,
          message: "Invalid path",
        });
      });
    });

    describe("error handling", () => {
      it("should handle 404 from files endpoint", async () => {
        mockFetch([
          ["GET", "https://unicode.org/Public/nonexistent/path", () => {
            return new Response("Not Found", { status: 404 });
          }],
        ]);

        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files/nonexistent/path"),
          env,
        );

        expect(response).toBeApiError({ status: 404, message: "Resource not found" });
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

        expect(response).toBeApiError({ status: 502, message: "Bad Gateway" });
      });
    });

    describe("content-type inference", () => {
      it("should handle missing content-type header", async () => {
        const mockContent = new Uint8Array([
          // eslint-disable-next-line antfu/consistent-list-newline
          0x49, 0x27, 0x6D, 0x20, 0x61, 0x20, 0x74, 0x65,
          // eslint-disable-next-line antfu/consistent-list-newline
          0x61, 0x70, 0x6F, 0x74, 0x2E, 0x20, 0x53, 0x68,
          // eslint-disable-next-line antfu/consistent-list-newline
          0x68, 0x68, 0x21,
        ]);

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

        expect(response).toMatchResponse({
          status: 200,
          headers: {
            "Content-Type": "application/octet-stream",
          },
          cache: true,
        });
      });

      it("should infer content-type from .txt when upstream omits it", async () => {
        const mockContent = "Plain text content";

        mockFetch([
          ["GET", "https://unicode.org/Public/sample/file.txt", () => {
            return new RawResponse(mockContent, {
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

        expect(response).toMatchResponse({
          status: 200,
          headers: {
            "Content-Type": "text/plain",
          },
          cache: true,
        });

        const content = await text();
        expect(content).toBe(mockContent);
      });

      it("should infer content-type from .xml when upstream omits it", async () => {
        const mockContent = "<root></root>";

        mockFetch([
          ["GET", "https://unicode.org/Public/sample/file.xml", () => {
            return new RawResponse(mockContent, {
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

        expect(response).toMatchResponse({
          status: 200,
          headers: {
            "Content-Type": "application/xml",
          },
          cache: true,
        });

        const content = await text();
        expect(content).toBe(mockContent);
      });

      it("should correctly extract extension from paths with dots in directory names", async () => {
        const mockContent = "Unicode data content";

        mockFetch([
          ["GET", "https://unicode.org/Public/15.1.0/ucd/UnicodeData", () => {
            return new RawResponse(mockContent, {
              headers: {
                "content-length": mockContent.length.toString(),
              },
            });
          }],
        ]);

        const { response, text } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/UnicodeData"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          headers: {
            "Content-Type": "application/octet-stream",
          },
          cache: true,
        });

        const content = await text();
        expect(content).toBe(mockContent);
      });
    });

    describe("pattern filter", () => {
      it("should filter directory listing by glob pattern *.txt", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
          { name: "emoji", path: "emoji/", type: "directory", lastModified: Date.now() },
          { name: "data.xml", path: "data.xml", type: "file", lastModified: Date.now() },
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

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const files = await json<FileEntryList>();
        expect(files).toHaveLength(2);
        expect(files.map((f) => f.name)).toEqual(["Blocks.txt", "UnicodeData.txt"]);
      });

      it("should filter directory listing by prefix pattern Uni*", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "Unihan.zip", path: "Unihan.zip", type: "file", lastModified: Date.now() },
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
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

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const files = await json<FileEntryList>();
        expect(files).toHaveLength(2);
        expect(files.map((f) => f.name)).toEqual(["UnicodeData.txt", "Unihan.zip"]);
      });

      it("should filter case-insensitively", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
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

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });

        const files = await json<FileEntryList>();
        expect(files).toHaveLength(1);
        expect(files[0]!.name).toBe("UnicodeData.txt");
      });

      it("should return empty array when no matches", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
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

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const files = await json<FileEntryList>();
        expect(files).toEqual([]);
      });

      it("should support multi-extension pattern *.{txt,xml}", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "ucd.all.flat.xml", path: "ucd.all.flat.xml", type: "file", lastModified: Date.now() },
          { name: "Unihan.zip", path: "Unihan.zip", type: "file", lastModified: Date.now() },
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

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const files = await json<FileEntryList>();
        expect(files).toHaveLength(2);
        expect(files.map((f) => f.name)).toEqual(["ucd.all.flat.xml", "UnicodeData.txt"]);
      });

      it("should support substring pattern *Data* (case-insensitive)", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "emoji-data.txt", path: "emoji-data.txt", type: "file", lastModified: Date.now() },
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
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

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const files = await json<FileEntryList>();
        expect(files).toHaveLength(2);
        expect(files.map((f) => f.name)).toEqual(["emoji-data.txt", "UnicodeData.txt"]);
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

        expect(response).toMatchResponse({
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });

        const content = await text();
        expect(content).toBe(mockFileContent);
      });

      it("should return 200 for empty pattern", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
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

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const result = await json();
        expect(result).toEqual([
          {
            lastModified: expect.any(Number),
            name: "UnicodeData.txt",
            path: "/15.1.0/ucd/UnicodeData.txt",
            type: "file",
          },
        ]);
      });
    });

    describe("query filter (prefix search)", () => {
      it("should filter entries by prefix", async () => {
        const html = generateAutoIndexHtml([
          { name: "come", path: "come/", type: "directory", lastModified: Date.now() },
          { name: "computer.txt", path: "computer.txt", type: "file", lastModified: Date.now() },
          { name: "other.txt", path: "other.txt", type: "file", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?query=com"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toContain("come");
        expect(results.map((r) => r.name)).toContain("computer.txt");
      });

      it("should search case-insensitively", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?query=unicode"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        expect(results).toHaveLength(1);
        expect(results[0]!.name).toBe("UnicodeData.txt");
      });

      it("should search within a specific path", async () => {
        const html = generateAutoIndexHtml([
          { name: "emoji-data.txt", path: "emoji-data.txt", type: "file", lastModified: Date.now() },
          { name: "emoji-sequences.txt", path: "emoji-sequences.txt", type: "file", lastModified: Date.now() },
          { name: "other.txt", path: "other.txt", type: "file", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public/15.1.0/ucd/emoji", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files/15.1.0/ucd/emoji?query=emoji"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(["emoji-data.txt", "emoji-sequences.txt"]);
      });

      it("should return empty array when no matches found", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?query=nonexistent"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();
        expect(results).toEqual([]);
      });

      it("should match exact entry name when query matches exactly", async () => {
        const html = generateAutoIndexHtml([
          { name: "come", path: "come/", type: "directory", lastModified: Date.now() },
          { name: "computer.txt", path: "computer.txt", type: "file", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?query=come"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        // Only the directory matches exactly
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ name: "come", type: "directory" });
      });

      it("should combine query with pattern filter", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "Unicode.zip", path: "Unicode.zip", type: "file", lastModified: Date.now() },
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?query=Uni&pattern=*.txt"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        expect(results).toHaveLength(1);
        expect(results[0]!.name).toBe("UnicodeData.txt");
      });
    });

    describe("type filter", () => {
      it("should return only files when type=files", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "emoji", path: "emoji/", type: "directory", lastModified: Date.now() },
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?type=files"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        expect(results).toHaveLength(2);
        expect(results.every((r) => r.type === "file")).toBe(true);
      });

      it("should return only directories when type=directories", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "emoji", path: "emoji/", type: "directory", lastModified: Date.now() },
          { name: "charts", path: "charts/", type: "directory", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?type=directories"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        expect(results).toHaveLength(2);
        expect(results.every((r) => r.type === "directory")).toBe(true);
      });

      it("should return all entries when type=all", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "emoji", path: "emoji/", type: "directory", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?type=all"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        expect(results).toHaveLength(2);
      });

      it("should combine type with query filter", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "Unicode", path: "Unicode/", type: "directory", lastModified: Date.now() },
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?query=Uni&type=files"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ name: "UnicodeData.txt", type: "file" });
      });
    });

    describe("sort and order", () => {
      it("should sort by name ascending by default", async () => {
        const html = generateAutoIndexHtml([
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "ArabicShaping.txt", path: "ArabicShaping.txt", type: "file", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();
        expect(results.map((r) => r.name)).toEqual([
          "ArabicShaping.txt",
          "Blocks.txt",
          "UnicodeData.txt",
        ]);
      });

      it("should sort by name descending when order=desc", async () => {
        const html = generateAutoIndexHtml([
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: Date.now() },
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "ArabicShaping.txt", path: "ArabicShaping.txt", type: "file", lastModified: Date.now() },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?sort=name&order=desc"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        expect(results.map((r) => r.name)).toEqual([
          "UnicodeData.txt",
          "Blocks.txt",
          "ArabicShaping.txt",
        ]);
      });

      it("should sort by lastModified ascending", async () => {
        const now = Date.now();
        const html = generateAutoIndexHtml([
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: now - 2000 },
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: now - 1000 },
          { name: "ArabicShaping.txt", path: "ArabicShaping.txt", type: "file", lastModified: now - 3000 },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?sort=lastModified&order=asc"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        // Check all entries returned and have lastModified
        expect(results).toHaveLength(3);
        expect(results.every((r) => typeof r.lastModified === "number")).toBe(true);

        // Verify sorted by lastModified ascending (oldest first)
        for (let i = 1; i < results.length; i++) {
          expect(results[i]!.lastModified!).toBeGreaterThanOrEqual(results[i - 1]!.lastModified!);
        }
      });

      it("should sort by lastModified descending", async () => {
        const now = Date.now();
        const html = generateAutoIndexHtml([
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: now - 2000 },
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: now - 1000 },
          { name: "ArabicShaping.txt", path: "ArabicShaping.txt", type: "file", lastModified: now - 3000 },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?sort=lastModified&order=desc"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();

        // Check all entries returned and have lastModified
        expect(results).toHaveLength(3);
        expect(results.every((r) => typeof r.lastModified === "number")).toBe(true);

        // Verify sorted by lastModified descending (newest first)
        for (let i = 1; i < results.length; i++) {
          expect(results[i]!.lastModified!).toBeLessThanOrEqual(results[i - 1]!.lastModified!);
        }
      });

      it("should combine sort with filters", async () => {
        const now = Date.now();
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "UnicodeData.txt", type: "file", lastModified: now - 1000 },
          { name: "Unihan.zip", path: "Unihan.zip", type: "file", lastModified: now - 3000 },
          { name: "Blocks.txt", path: "Blocks.txt", type: "file", lastModified: now - 2000 },
        ], "F2");

        mockFetch([
          ["GET", "https://unicode.org/Public", () => {
            return HttpResponse.text(html, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }],
        ]);

        const { response, json } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files?query=Uni&sort=lastModified&order=desc"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          json: true,
        });
        const results = await json<FileEntryList>();
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual([
          "UnicodeData.txt",
          "Unihan.zip",
        ]);
      });
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("HEAD /api/v1/files/:wildcard", () => {
    describe("successful requests", () => {
      it("should return headers for a specific file path", async () => {
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

        expect(response).toMatchResponse({
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
          cache: true,
        });
      });

      it("should include size headers for HEAD file requests", async () => {
        const mockFileContent = "Head response content";

        mockFetch([
          ["GET", "https://unicode.org/Public/sample/file.txt", () => {
            return HttpResponse.text(mockFileContent, {
              headers: {
                "content-type": "text/plain; charset=utf-8",
                "content-length": mockFileContent.length.toString(),
              },
            });
          }],
        ]);

        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files/sample/file.txt", {
            method: "HEAD",
          }),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
          cache: true,
        });

        expect(response.headers.get("Content-Length")).toBe(`${mockFileContent.length}`);
        expect(response.headers.get(UCD_STAT_SIZE_HEADER)).toBe(`${mockFileContent.length}`);
        expect(response.headers.get(UCD_STAT_TYPE_HEADER)).toBe("file");
      });

      it("should handle HEAD requests for directories", async () => {
        const html = generateAutoIndexHtml([
          { name: "UnicodeData.txt", path: "15.1.0/ucd/UnicodeData.txt", type: "file", lastModified: Date.now() },
          { name: "Blocks.txt", path: "15.1.0/ucd/Blocks.txt", type: "file", lastModified: Date.now() },
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

        expect(response).toMatchResponse({
          status: 200,
          json: true,
          cache: true,
        });
        expect(response.headers.get(UCD_STAT_TYPE_HEADER)).toBe("directory");
        expect(response.headers.get("content-length")).toBeDefined();
        expect(response.headers.get("last-modified")).toBeDefined();
      });
    });

    describe("path validation", () => {
      it("should handle HEAD requests with invalid paths", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files/..%2Ftest", {
            method: "HEAD",
          }),
          env,
        );

        expect(response).toBeHeadError(400);
      });

      it("should handle HEAD requests with '//' segments", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/files/path//with//double//slashes", {
            method: "HEAD",
          }),
          env,
        );

        expect(response).toBeHeadError(400);
      });
    });

    describe("error handling", () => {
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

        expect(response).toBeHeadError(404);
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

        expect(response).toBeHeadError(502);
      });
    });

    describe("content-type inference", () => {
      it("should handle HEAD requests with missing content-type header", async () => {
        const mockContent = new Uint8Array([
          // eslint-disable-next-line antfu/consistent-list-newline
          0x49, 0x27, 0x6D, 0x20, 0x61, 0x20, 0x74, 0x65,
          // eslint-disable-next-line antfu/consistent-list-newline
          0x61, 0x70, 0x6F, 0x74, 0x2E, 0x20, 0x53, 0x68,
          // eslint-disable-next-line antfu/consistent-list-newline
          0x68, 0x68, 0x21,
        ]);

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

        expect(response).toMatchResponse({
          status: 200,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        });
      });
    });
  });
});

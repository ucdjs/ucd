import { HttpResponse, mockFetch } from "#test-utils/msw";

import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";
import { expectApiError, expectSuccess } from "../../helpers/response";

describe("v1_files", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/files/search", () => {
    it("should search files by prefix and return files first", async () => {
      const html = generateAutoIndexHtml([
        { name: "come", path: "/Public/come", type: "directory", lastModified: Date.now() },
        { name: "computer.txt", path: "/Public/computer.txt", type: "file", lastModified: Date.now() },
        { name: "other.txt", path: "/Public/other.txt", type: "file", lastModified: Date.now() },
      ], "F2");

      mockFetch([
        ["GET", "https://unicode.org/Public", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd/emoji", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/search?q=nonexistent"),
        env,
      );

      expectSuccess(response);
      const results = await json();
      expect(results).toEqual([]);
    });

    it("should return empty array when path does not exist", async () => {
      mockFetch([
        ["GET", "https://unicode.org/Public/nonexistent/path", () => {
          return HttpResponse.text("Not Found", { status: 404 });
        }],
      ]);

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

      mockFetch([
        ["GET", "https://unicode.org/Public", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

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

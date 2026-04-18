/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import { UCD_STAT_CHILDREN_HEADER, UCD_STAT_SIZE_HEADER, UCD_STAT_TYPE_HEADER } from "@ucdjs/env";
import { HttpResponse, mockFetch } from "@ucdjs/test-utils/msw";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";

describe("v1_files", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("HEAD /api/v1/files/:wildcard", () => {
    describe("successful requests", () => {
      it("should return headers for a specific file path", async () => {
        const mockFileContent = "# Unicode Character Database\n# Version 15.1.0\n";

        mockFetch([
          ["HEAD", "https://unicode.org/Public/15.1.0/ucd/UnicodeData.txt", () => {
            return new HttpResponse(null, {
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

      it("should handle HEAD requests for directories", async () => {
        const lastModified = new Date("2025-08-16T00:45:11Z").toUTCString();

        mockFetch([
          ["HEAD", "https://unicode.org/Public/15.1.0/ucd", () => {
            return new HttpResponse(null, {
              headers: {
                "content-type": "text/html; charset=utf-8",
                "last-modified": lastModified,
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
          headers: {
            "Content-Type": "application/json",
          },
          cache: true,
        });
        expect(response.headers.get(UCD_STAT_TYPE_HEADER)).toBe("directory");
        expect(response.headers.get("Last-Modified")).toBe(lastModified);
        expect(response.headers.get(UCD_STAT_CHILDREN_HEADER)).toBeNull();
        expect(response.headers.get(UCD_STAT_SIZE_HEADER)).toBeNull();
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
    });

    describe("error handling", () => {
      it("should handle HEAD requests for non-existent files", async () => {
        mockFetch([
          ["HEAD", "https://unicode.org/Public/nonexistent/path", () => {
            return new HttpResponse(null, { status: 404 });
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
          ["HEAD", "https://unicode.org/Public/binary/file", () => {
            return new Response(null, {
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

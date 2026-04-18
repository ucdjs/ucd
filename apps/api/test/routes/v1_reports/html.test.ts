/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import { HttpResponse, mockFetch } from "@ucdjs/test-utils/msw";
import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { executeRequest } from "../../helpers/request";
import { createUnavailableProposedReportHtml } from "./_helpers";

describe("v1_reports", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/reports/{reportId}/rev/{revId}/html", () => {
    it("returns a sanitized preview and stores it in R2", async () => {
      const html = `
        <!doctype html>
        <html>
          <head>
            <link rel="stylesheet" href="https://www.unicode.org/reports/reports-v2.css">
            <script src="https://www.unicode.org/assets/report.js"></script>
          </head>
          <body onclick="alert('xss')">
            <h1>Revision 34</h1>
          </body>
        </html>
      `;
      const mockGet = vi.fn().mockResolvedValue(null);
      const mockPut = vi.fn().mockResolvedValue(undefined);

      mockFetch([
        ["GET", "https://www.unicode.org/reports/tr44/tr44-34.html", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

      const { response, text } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/34/html"),
        {
          ...env,
          UCD_BUCKET: {
            get: mockGet,
            put: mockPut,
          } as any,
        },
      );

      expect(response).toMatchResponse({
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Security-Policy": /script-src 'none'/,
        },
        cache: true,
      });

      await expect(text()).resolves.toContain("<base href=\"https://www.unicode.org/reports/tr44/tr44-34.html\">");
      await expect(text()).resolves.not.toContain("<script");
      await expect(text()).resolves.not.toContain("onclick=");
      expect(mockGet).toHaveBeenCalledWith("reports/preview/tr44/34.html");
      expect(mockPut).toHaveBeenCalledWith(
        "reports/preview/tr44/34.html",
        expect.stringContaining("Revision 34"),
        {
          httpMetadata: { contentType: "text/html; charset=utf-8" },
        },
      );
    });

    it("serves a cached preview from R2 without refetching upstream", async () => {
      const cachedHtml = "<html><head><base href=\"https://www.unicode.org/reports/tr44/tr44-34.html\"></head><body><h1>Cached</h1></body></html>";
      const mockGet = vi.fn().mockResolvedValue({
        body: new Response(cachedHtml).body,
        uploaded: new Date("2024-01-01T00:00:00.000Z"),
        httpEtag: "\"preview-etag\"",
      });

      const { response, text } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/34/html"),
        {
          ...env,
          UCD_BUCKET: {
            get: mockGet,
          } as any,
        },
      );

      expect(response).toMatchResponse({
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "ETag": "\"preview-etag\"",
        },
        cache: true,
      });

      await expect(text()).resolves.toBe(cachedHtml);
    });

    it("returns 400 for an invalid revision id", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/latest/html"),
        env,
      );

      expect(response).toBeApiError({
        status: 400,
        message: "Invalid revision id",
      });
    });

    it("returns 404 when the requested HTML revision does not exist", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/reports/tr44/tr44-999.html", () => {
          return new Response("Not Found", { status: 404 });
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/999/html"),
        env,
      );

      expect(response).toBeApiError({
        status: 404,
        message: "Resource not found",
      });
    });

    it("returns 404 for proposed HTML when the proposed page is the unavailable placeholder", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/reports/tr44/proposed.html", () => {
          return HttpResponse.text(createUnavailableProposedReportHtml(), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/proposed/html"),
        env,
      );

      expect(response).toBeApiError({
        status: 404,
        message: "Resource not found",
      });
    });
  });
});

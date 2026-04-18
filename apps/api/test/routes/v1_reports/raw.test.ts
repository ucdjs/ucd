/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import { HttpResponse, mockFetch } from "@ucdjs/test-utils/msw";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";
import { createUnavailableProposedReportHtml } from "./_helpers";

describe("v1_reports", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/reports/{reportId}/rev/{revId}/raw", () => {
    it("streams a numeric revision", async () => {
      const html = "<html><body><h1>Revision 34</h1><script>window.alert('raw')</script></body></html>";

      mockFetch([
        ["GET", "https://www.unicode.org/reports/tr44/tr44-34.html", () => {
          return HttpResponse.text(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

      const { response, text } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/34/raw"),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
        cache: true,
      });

      await expect(text()).resolves.toBe(html);
    });

    it("returns 400 for an invalid revision id", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/latest/raw"),
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
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/999/raw"),
        env,
      );

      expect(response).toBeApiError({
        status: 404,
        message: "Resource not found",
      });
    });

    it("returns 404 for proposed raw HTML when the proposed page is the unavailable placeholder", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/reports/tr44/proposed.html", () => {
          return HttpResponse.text(createUnavailableProposedReportHtml(), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/proposed/raw"),
        env,
      );

      expect(response).toBeApiError({
        status: 404,
        message: "Resource not found",
      });
    });
  });
});

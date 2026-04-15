/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import { HttpResponse, mockFetch } from "@ucdjs/test-utils/msw";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";
import { createReportHtml } from "./_helpers";

describe("v1_reports", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/reports/{reportId}", () => {
    it("returns the latest revision metadata for a report", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/reports/tr44/", () => {
          return HttpResponse.text(createReportHtml({
            reportId: "tr44",
            title: "Unicode Character Database",
            currentRevision: 36,
            previousRevision: 34,
          }), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
        ["GET", "https://www.unicode.org/reports/tr44/tr44-36.html", () => {
          return HttpResponse.text(createReportHtml({
            reportId: "tr44",
            title: "Unicode Character Database",
            currentRevision: 36,
            previousRevision: 34,
          }), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44"),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
      });

      await expect(json()).resolves.toEqual({
        reportId: "tr44",
        title: "Unicode Character Database",
        revision: {
          revId: "36",
          revision: 36,
          htmlPath: "/api/v1/reports/tr44/rev/36/html",
          upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-36.html",
        },
        previous: {
          revId: "34",
          revision: 34,
          htmlPath: "/api/v1/reports/tr44/rev/34/html",
          upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-34.html",
        },
        next: null,
      });
    });

    it("returns 400 for an invalid report id", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/not-a-report"),
        env,
      );

      expect(response).toBeApiError({
        status: 400,
        message: "Invalid report id",
      });
    });

    it("returns 404 when the report does not exist upstream", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/reports/tr999/", () => {
          return new Response("Not Found", { status: 404 });
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr999"),
        env,
      );

      expect(response).toBeApiError({
        status: 404,
        message: "Report not found",
      });
    });
  });
});

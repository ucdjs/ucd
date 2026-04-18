/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import { HttpResponse, mockFetch } from "@ucdjs/test-utils/msw";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";
import { createReportHtml, createUnavailableProposedReportHtml } from "./_helpers";

describe("v1_reports", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/reports/{reportId}/rev/{revId}", () => {
    it("returns metadata for a specific numeric revision", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/reports/tr44/tr44-34.html", () => {
          return HttpResponse.text(createReportHtml({
            reportId: "tr44",
            title: "Unicode Character Database Revision 34",
            currentRevision: 34,
            previousRevision: 33,
            includeProposed: true,
          }), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
        ["GET", "https://www.unicode.org/reports/tr44/proposed.html", () => {
          return HttpResponse.text(createReportHtml({
            reportId: "tr44",
            title: "Unicode Character Database Proposed Update",
            currentRevision: 35,
            previousRevision: 34,
          }), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/34"),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
      });

      await expect(json()).resolves.toEqual({
        reportId: "tr44",
        title: "Unicode Character Database Revision 34",
        revision: {
          revId: "34",
          revision: 34,
          htmlPath: "/api/v1/reports/tr44/rev/34/html",
          upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-34.html",
        },
        previous: {
          revId: "33",
          revision: 33,
          htmlPath: "/api/v1/reports/tr44/rev/33/html",
          upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-33.html",
        },
        next: {
          revId: "proposed",
          revision: null,
          htmlPath: "/api/v1/reports/tr44/rev/proposed/html",
          upstreamUrl: "https://www.unicode.org/reports/tr44/proposed.html",
        },
      });
    });

    it("returns metadata for the proposed revision", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/reports/tr44/proposed.html", () => {
          return HttpResponse.text(createReportHtml({
            reportId: "tr44",
            title: "Unicode Character Database Proposed Update",
            currentRevision: 37,
            previousRevision: 36,
          }), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/proposed"),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
      });

      await expect(json()).resolves.toEqual({
        reportId: "tr44",
        title: "Unicode Character Database Proposed Update",
        revision: {
          revId: "proposed",
          revision: 37,
          htmlPath: "/api/v1/reports/tr44/rev/proposed/html",
          upstreamUrl: "https://www.unicode.org/reports/tr44/proposed.html",
        },
        previous: {
          revId: "36",
          revision: 36,
          htmlPath: "/api/v1/reports/tr44/rev/36/html",
          upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-36.html",
        },
        next: null,
      });
    });

    it("returns 400 for an invalid report id", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/nope/rev/34"),
        env,
      );

      expect(response).toBeApiError({
        status: 400,
        message: "Invalid report id",
      });
    });

    it("returns 400 for an invalid revision id", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/latest"),
        env,
      );

      expect(response).toBeApiError({
        status: 400,
        message: "Invalid revision id",
      });
    });

    it("returns 404 when the requested revision does not exist", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/reports/tr44/tr44-999.html", () => {
          return new Response("Not Found", { status: 404 });
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/999"),
        env,
      );

      expect(response).toBeApiError({
        status: 404,
        message: "Report revision not found",
      });
    });

    it("returns 404 for proposed metadata when the proposed page is the unavailable placeholder", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/reports/tr44/proposed.html", () => {
          return HttpResponse.text(createUnavailableProposedReportHtml(), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports/tr44/rev/proposed"),
        env,
      );

      expect(response).toBeApiError({
        status: 404,
        message: "Report revision not found",
      });
    });
  });
});

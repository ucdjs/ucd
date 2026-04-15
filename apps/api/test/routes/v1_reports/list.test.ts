/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import { HttpResponse, mockFetch } from "@ucdjs/test-utils/msw";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";
import { createReportHtml, createReportsIndexHtml } from "./_helpers";

describe("v1_reports", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/reports", () => {
    it("lists reports with latest, previous, and next metadata", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/reports/", () => {
          return HttpResponse.text(createReportsIndexHtml(), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
        ["GET", "https://www.unicode.org/reports/tr9/", () => {
          return HttpResponse.text(createReportHtml({
            reportId: "tr9",
            title: "Unicode Bidirectional Algorithm",
            currentRevision: 51,
            previousRevision: 50,
          }), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
        ["GET", "https://www.unicode.org/reports/tr44/", () => {
          return HttpResponse.text(createReportHtml({
            reportId: "tr44",
            title: "Unicode Character Database",
            currentRevision: 36,
            previousRevision: 34,
            includeProposed: true,
          }), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
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
        new Request("https://api.ucdjs.dev/api/v1/reports"),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
      });

      await expect(json()).resolves.toEqual([
        {
          id: "tr9",
          title: "Unicode Bidirectional Algorithm",
          latest: {
            revId: "51",
            revision: 51,
            htmlPath: "/api/v1/reports/tr9/rev/51/html",
            upstreamUrl: "https://www.unicode.org/reports/tr9/",
          },
          previous: {
            revId: "50",
            revision: 50,
            htmlPath: "/api/v1/reports/tr9/rev/50/html",
            upstreamUrl: "https://www.unicode.org/reports/tr9/tr9-50.html",
          },
          next: null,
        },
        {
          id: "tr44",
          title: "Unicode Character Database",
          latest: {
            revId: "36",
            revision: 36,
            htmlPath: "/api/v1/reports/tr44/rev/36/html",
            upstreamUrl: "https://www.unicode.org/reports/tr44/",
          },
          previous: {
            revId: "34",
            revision: 34,
            htmlPath: "/api/v1/reports/tr44/rev/34/html",
            upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-34.html",
          },
          next: {
            revId: "proposed",
            revision: 37,
            htmlPath: "/api/v1/reports/tr44/rev/proposed/html",
            upstreamUrl: "https://www.unicode.org/reports/tr44/proposed.html",
          },
        },
      ]);
    });

    it("returns an empty list when the reports index has no report links", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/reports/", () => {
          return HttpResponse.text("<html><body><a href=\"/reports/stable.html\">stable</a></body></html>", {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/reports"),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
      });

      await expect(json()).resolves.toEqual([]);
    });
  });
});

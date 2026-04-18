import type {
  UnicodeReportRevisionMetadata,
  UnicodeReportSummary,
} from "@ucdjs/schemas";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { HttpResponse, mockFetch } from "@ucdjs/test-utils/msw";
import { describe, expect, it } from "vitest";
import { createReportsResource } from "../../src/resources/reports";

describe("createReportsResource", () => {
  const baseUrl = UCDJS_API_BASE_URL;
  const endpoints = {
    files: "/api/v1/files",
    manifest: "/api/v1/versions/{version}/manifest",
    reports: "/api/v1/reports",
    versions: "/api/v1/versions",
  };

  const mockReports = [
    {
      id: "tr44",
      title: "Unicode Character Database",
      latest: {
        revId: "36",
        revision: 36,
        htmlPath: "/api/v1/reports/tr44/rev/36/html",
        upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-36.html",
      },
      previous: {
        revId: "35",
        revision: 35,
        htmlPath: "/api/v1/reports/tr44/rev/35/html",
        upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-35.html",
      },
      next: null,
    },
  ] satisfies UnicodeReportSummary[];

  const mockRevision = {
    reportId: "tr44",
    title: "Unicode Character Database",
    revision: {
      revId: "36",
      revision: 36,
      htmlPath: "/api/v1/reports/tr44/rev/36/html",
      upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-36.html",
    },
    previous: {
      revId: "35",
      revision: 35,
      htmlPath: "/api/v1/reports/tr44/rev/35/html",
      upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-35.html",
    },
    next: {
      revId: "proposed",
      revision: null,
      htmlPath: "/api/v1/reports/tr44/rev/proposed/html",
      upstreamUrl: "https://www.unicode.org/reports/tr44/proposed.html",
    },
  } satisfies UnicodeReportRevisionMetadata;

  describe("list()", () => {
    it("should fetch report summaries successfully", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.reports}`, () => {
          return HttpResponse.json(mockReports);
        }],
      ]);

      const reportsResource = createReportsResource({ baseUrl, endpoints });
      const { data, error } = await reportsResource.list();

      expect(error).toBeNull();
      expect(data).toEqual(mockReports);
    });
  });

  describe("get()", () => {
    it("should fetch the latest report revision metadata", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.reports}/tr44`, () => {
          return HttpResponse.json(mockRevision);
        }],
      ]);

      const reportsResource = createReportsResource({ baseUrl, endpoints });
      const { data, error } = await reportsResource.get("tr44");

      expect(error).toBeNull();
      expect(data).toEqual(mockRevision);
    });
  });

  describe("getRevision()", () => {
    it("should fetch a specific report revision", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.reports}/tr44/rev/36`, () => {
          return HttpResponse.json(mockRevision);
        }],
      ]);

      const reportsResource = createReportsResource({ baseUrl, endpoints });
      const { data, error } = await reportsResource.getRevision("tr44", "36");

      expect(error).toBeNull();
      expect(data).toEqual(mockRevision);
    });
  });

  describe("getHtml()", () => {
    it("should fetch the report HTML document", async () => {
      const html = "<html><body><h1>TR44</h1></body></html>";

      mockFetch([
        ["GET", `${baseUrl}${endpoints.reports}/tr44/rev/36/html`, () => {
          return HttpResponse.text(html, {
            headers: {
              "content-type": "text/html; charset=utf-8",
            },
          });
        }],
      ]);

      const reportsResource = createReportsResource({ baseUrl, endpoints });
      const { data, error } = await reportsResource.getHtml("tr44", "36");

      expect(error).toBeNull();
      expect(data).toBe(html);
    });

    it("should work with custom reports paths", async () => {
      const html = "<html><body>custom</body></html>";
      const customReportsPath = "/custom/reports";

      mockFetch([
        ["GET", `${baseUrl}${customReportsPath}/tr44/rev/proposed/html`, () => {
          return HttpResponse.text(html, {
            headers: {
              "content-type": "text/html; charset=utf-8",
            },
          });
        }],
      ]);

      const reportsResource = createReportsResource({
        baseUrl,
        endpoints: {
          ...endpoints,
          reports: customReportsPath,
        },
      });
      const { data, error } = await reportsResource.getHtml("tr44", "proposed");

      expect(error).toBeNull();
      expect(data).toBe(html);
    });
  });

  describe("getRaw()", () => {
    it("should fetch the raw report HTML document", async () => {
      const html = "<html><body><script>alert('raw')</script></body></html>";

      mockFetch([
        ["GET", `${baseUrl}${endpoints.reports}/tr44/rev/36/raw`, () => {
          return HttpResponse.text(html, {
            headers: {
              "content-type": "text/html; charset=utf-8",
            },
          });
        }],
      ]);

      const reportsResource = createReportsResource({ baseUrl, endpoints });
      const { data, error } = await reportsResource.getRaw("tr44", "36");

      expect(error).toBeNull();
      expect(data).toBe(html);
    });

    it("should work with custom reports paths", async () => {
      const html = "<html><body>custom raw</body></html>";
      const customReportsPath = "/custom/reports";

      mockFetch([
        ["GET", `${baseUrl}${customReportsPath}/tr44/rev/proposed/raw`, () => {
          return HttpResponse.text(html, {
            headers: {
              "content-type": "text/html; charset=utf-8",
            },
          });
        }],
      ]);

      const reportsResource = createReportsResource({
        baseUrl,
        endpoints: {
          ...endpoints,
          reports: customReportsPath,
        },
      });
      const { data, error } = await reportsResource.getRaw("tr44", "proposed");

      expect(error).toBeNull();
      expect(data).toBe(html);
    });
  });
});

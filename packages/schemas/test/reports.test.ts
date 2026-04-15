/// <reference types="../../test-utils/src/matchers/types.d.ts" />

import { describe, expect, it } from "vitest";
import {
  ReportRevisionReferenceSchema,
  UnicodeReportRevisionMetadataSchema,
  UnicodeReportSummarySchema,
} from "../src/reports";

// eslint-disable-next-line test/prefer-lowercase-title
describe("Unicode report schemas", () => {
  it("should validate a report revision reference", () => {
    const reference = {
      revId: "36",
      revision: 36,
      htmlPath: "/api/v1/reports/tr44/rev/36/html",
      upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-36.html",
    };

    expect(reference).toMatchSchema({
      schema: ReportRevisionReferenceSchema,
      success: true,
      data: reference,
    });
  });

  it("should validate a report summary", () => {
    const summary = {
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
    };

    expect(summary).toMatchSchema({
      schema: UnicodeReportSummarySchema,
      success: true,
      data: summary,
    });
  });

  it("should validate report revision metadata", () => {
    const metadata = {
      reportId: "tr44",
      title: "Unicode Character Database",
      revision: {
        revId: "36",
        revision: 36,
        htmlPath: "/api/v1/reports/tr44/rev/36/html",
        upstreamUrl: "https://www.unicode.org/reports/tr44/tr44-36.html",
      },
      previous: null,
      next: {
        revId: "proposed",
        revision: null,
        htmlPath: "/api/v1/reports/tr44/rev/proposed/html",
        upstreamUrl: "https://www.unicode.org/reports/tr44/proposed.html",
      },
    };

    expect(metadata).toMatchSchema({
      schema: UnicodeReportRevisionMetadataSchema,
      success: true,
      data: metadata,
    });
  });
});

import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type {
  UCDWellKnownConfig,
  UnicodeReportRevisionMetadata,
  UnicodeReportSummary,
} from "@ucdjs/schemas";
import { customFetch } from "@ucdjs-internal/shared";
import {
  UnicodeReportRevisionMetadataSchema,
  UnicodeReportSummarySchema,
} from "@ucdjs/schemas";

export interface ReportsResource {
  /**
   * List all published Unicode reports with adjacent revision metadata.
   */
  list: () => Promise<SafeFetchResponse<UnicodeReportSummary[]>>;

  /**
   * Get the latest revision metadata for a specific report.
   */
  get: (reportId: string) => Promise<SafeFetchResponse<UnicodeReportRevisionMetadata>>;

  /**
   * Get metadata for a specific report revision.
   */
  getRevision: (reportId: string, revId: string) => Promise<SafeFetchResponse<UnicodeReportRevisionMetadata>>;

  /**
   * Get the HTML document for a specific report revision.
   */
  getHtml: (reportId: string, revId: string) => Promise<SafeFetchResponse<string>>;
}

export interface CreateReportsResourceOptions {
  baseUrl: string;
  endpoints: UCDWellKnownConfig["endpoints"];
}

export function createReportsResource(options: CreateReportsResourceOptions): ReportsResource {
  const { baseUrl, endpoints } = options;

  return {
    async list() {
      const url = new URL(endpoints.reports, baseUrl);

      return customFetch.safe<UnicodeReportSummary[], "json">(url.toString(), {
        parseAs: "json",
        schema: UnicodeReportSummarySchema.array(),
      });
    },

    async get(reportId: string) {
      const url = new URL(`${endpoints.reports}/${encodeURIComponent(reportId)}`, baseUrl);

      return customFetch.safe<UnicodeReportRevisionMetadata, "json">(url.toString(), {
        parseAs: "json",
        schema: UnicodeReportRevisionMetadataSchema,
      });
    },

    async getRevision(reportId: string, revId: string) {
      const url = new URL(`${endpoints.reports}/${encodeURIComponent(reportId)}/rev/${encodeURIComponent(revId)}`, baseUrl);

      return customFetch.safe<UnicodeReportRevisionMetadata, "json">(url.toString(), {
        parseAs: "json",
        schema: UnicodeReportRevisionMetadataSchema,
      });
    },

    async getHtml(reportId: string, revId: string) {
      const url = new URL(`${endpoints.reports}/${encodeURIComponent(reportId)}/rev/${encodeURIComponent(revId)}/html`, baseUrl);

      return customFetch.safe<string, "text">(url.toString(), {
        parseAs: "text",
      });
    },
  };
}

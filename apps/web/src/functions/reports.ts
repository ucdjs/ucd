import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  UnicodeReportRevisionMetadataSchema,
  UnicodeReportSummarySchema,
} from "@ucdjs/schemas";
import { highlight } from "../lib/highlight";

export const fetchAllReports = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const res = await fetch(`${context.apiBaseUrl}/api/v1/reports`, {
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch reports");
    }

    const parseResult = UnicodeReportSummarySchema.array().safeParse(await res.json());
    if (!parseResult.success) {
      throw new Error("Invalid report list received from server");
    }

    return parseResult.data;
  });

export function reportsQueryOptions() {
  return queryOptions({
    queryKey: ["reports"],
    queryFn: () => fetchAllReports(),
  });
}

export const fetchReport = createServerFn({ method: "GET" })
  .inputValidator((data: { reportId: string }) => data)
  .handler(async ({ context, data }) => {
    const res = await fetch(`${context.apiBaseUrl}/api/v1/reports/${data.reportId}`, {
      headers: { accept: "application/json" },
    });

    if (res.status === 400 || res.status === 404) {
      throw notFound();
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch report ${data.reportId}`);
    }

    const parseResult = UnicodeReportRevisionMetadataSchema.safeParse(await res.json());
    if (!parseResult.success) {
      throw new Error("Invalid report metadata received from server");
    }

    return parseResult.data;
  });

export function reportQueryOptions(reportId: string) {
  return queryOptions({
    queryKey: ["reports", reportId],
    queryFn: () => fetchReport({ data: { reportId } }),
    enabled: Boolean(reportId),
  });
}

export const fetchReportRevision = createServerFn({ method: "GET" })
  .inputValidator((data: { reportId: string; revId: string }) => data)
  .handler(async ({ context, data }) => {
    const res = await fetch(`${context.apiBaseUrl}/api/v1/reports/${data.reportId}/rev/${data.revId}`, {
      headers: { accept: "application/json" },
    });

    if (res.status === 400 || res.status === 404) {
      throw notFound();
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch report revision ${data.reportId}@${data.revId}`);
    }

    const parseResult = UnicodeReportRevisionMetadataSchema.safeParse(await res.json());
    if (!parseResult.success) {
      throw new Error("Invalid report revision metadata received from server");
    }

    return parseResult.data;
  });

export function reportRevisionQueryOptions(reportId: string, revId: string) {
  return queryOptions({
    queryKey: ["reports", reportId, "rev", revId],
    queryFn: () => fetchReportRevision({ data: { reportId, revId } }),
    enabled: Boolean(reportId && revId),
  });
}

export const fetchReportCode = createServerFn({ method: "GET" })
  .inputValidator((data: { reportId: string; revId: string }) => data)
  .handler(async ({ context, data }) => {
    const res = await fetch(new URL(`/api/v1/reports/${data.reportId}/rev/${data.revId}/raw`, context.apiBaseUrl), {
      headers: { accept: "text/html" },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch report source ${data.reportId}@${data.revId}`);
    }

    return highlight(await res.text(), "html");
  });

export function reportCodeQueryOptions(reportId: string, revId: string) {
  return queryOptions({
    queryKey: ["reports", reportId, "rev", revId, "code"],
    queryFn: () => fetchReportCode({ data: { reportId, revId } }),
    enabled: Boolean(reportId && revId),
  });
}

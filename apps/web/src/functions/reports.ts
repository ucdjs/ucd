import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { highlight } from "../lib/highlight";

export const fetchAllReports = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const { data, error, response } = await context.client.reports.list();

    if (error || !response?.ok || !data) {
      throw new Error("Failed to fetch reports");
    }

    return data;
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
    const { data: report, error, response } = await context.client.reports.get(data.reportId);
    const status = error?.status ?? response?.status;

    if (status === 400 || status === 404) {
      throw notFound();
    }

    if (error || !response?.ok || !report) {
      throw new Error(`Failed to fetch report ${data.reportId}`);
    }

    return report;
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
    const { data: report, error, response } = await context.client.reports.getRevision(data.reportId, data.revId);
    const status = error?.status ?? response?.status;

    if (status === 400 || status === 404) {
      throw notFound();
    }

    if (error || !response?.ok || !report) {
      throw new Error(`Failed to fetch report revision ${data.reportId}@${data.revId}`);
    }

    return report;
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
    const { data: text, error, response } = await context.client.reports.getHtml(
      data.reportId,
      data.revId,
    );

    if (error || !response?.ok || typeof text !== "string") {
      throw new Error(`Failed to fetch report preview ${data.reportId}@${data.revId}`);
    }

    return highlight(text, "html");
  });

export function reportCodeQueryOptions(reportId: string, revId: string) {
  return queryOptions({
    queryKey: ["reports", reportId, "rev", revId, "code"],
    queryFn: () => fetchReportCode({ data: { reportId, revId } }),
    enabled: Boolean(reportId && revId),
  });
}

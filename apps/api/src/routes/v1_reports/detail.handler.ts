import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import {
  getUnicodeReportRevisionMetadata,
  getUnicodeReportSummary,
  isValidReportId,
} from "#lib/reports";
import { badRequest, notFound } from "@ucdjs-internal/worker-utils";
import { GET_REPORT_ROUTE } from "./detail.openapi";

export function registerGetReportRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_REPORT_ROUTE, async (c) => {
    const reportId = c.req.param("reportId");
    if (!isValidReportId(reportId)) {
      return badRequest(c, {
        message: "Invalid report id",
      });
    }

    const report = await getUnicodeReportSummary(reportId);
    const latestRevId = report?.latest?.revId;

    if (!latestRevId) {
      return notFound(c, {
        message: "Report not found",
      });
    }

    const revision = await getUnicodeReportRevisionMetadata(reportId, latestRevId);
    if (!revision) {
      return notFound(c, {
        message: "Report revision not found",
      });
    }

    return c.json(revision, 200);
  });
}

import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import {
  getUnicodeReportRevisionMetadata,
  isValidReportId,
} from "#lib/reports";
import { badRequest, notFound } from "@ucdjs-internal/worker-utils";
import { GET_REPORT_REVISION_ROUTE } from "./revision.openapi";
import { NUMERIC_REVISION_ID_RE } from "./shared";

export function registerGetReportRevisionRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_REPORT_REVISION_ROUTE, async (c) => {
    const reportId = c.req.param("reportId");
    const revId = c.req.param("revId");

    if (!isValidReportId(reportId)) {
      return badRequest(c, {
        message: "Invalid report id",
      });
    }

    if (!(revId === "proposed" || NUMERIC_REVISION_ID_RE.test(revId))) {
      return badRequest(c, {
        message: "Invalid revision id",
      });
    }

    const revision = await getUnicodeReportRevisionMetadata(reportId, revId);
    if (!revision) {
      return notFound(c, {
        message: "Report revision not found",
      });
    }

    return c.json(revision, 200);
  });
}

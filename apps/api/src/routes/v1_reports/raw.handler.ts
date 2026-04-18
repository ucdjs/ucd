import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { StatusCode } from "hono/utils/http-status";
import { getUnicodeReportRawHtml } from "#lib/reports";
import { customError } from "@ucdjs-internal/worker-utils";
import { GET_REPORT_RAW_ROUTE } from "./raw.openapi";

export function registerGetReportRawRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_REPORT_RAW_ROUTE, async (c) => {
    const reportId = c.req.param("reportId");
    const revId = c.req.param("revId");

    const { body, headers, status } = await getUnicodeReportRawHtml(reportId, revId);
    if (status !== 200) {
      let errorMessage = `Upstream responded with status ${status}`;

      if (typeof body === "string") {
        try {
          const errorBody = JSON.parse(body);
          if (errorBody.message) {
            errorMessage = errorBody.message;
          }
        } catch {
        }
      }

      return customError(c, {
        status,
        message: errorMessage,
        headers,
      });
    }

    return c.newResponse(body, status as StatusCode, headers);
  });
}

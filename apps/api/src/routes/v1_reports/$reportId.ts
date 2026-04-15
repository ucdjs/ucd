import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { getUnicodeReportRevisionMetadata, getUnicodeReportSummary, isValidReportId } from "#lib/reports";
import { createRoute } from "@hono/zod-openapi";
import { badRequest, MAX_AGE_ONE_WEEK_SECONDS, notFound } from "@ucdjs-internal/worker-utils";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { REPORT_ID_PARAM, UnicodeReportRevisionMetadataSchema } from "./shared";

const GET_REPORT_ROUTE = createRoute({
  method: "get",
  path: "/{reportId}",
  tags: [OPENAPI_TAGS.REPORTS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_reports:report",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`,
    }),
  ],
  parameters: [
    REPORT_ID_PARAM,
  ],
  description: "Resolve a report id to its latest revision metadata.",
  responses: {
    200: {
      description: "Latest Unicode report revision metadata",
      content: {
        "application/json": {
          schema: UnicodeReportRevisionMetadataSchema,
        },
      },
    },
    ...(generateReferences([
      400,
      404,
      500,
      502,
    ])),
  },
});

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

import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { listUnicodeReports } from "#lib/reports";
import { createRoute, z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { MAX_AGE_ONE_WEEK_SECONDS } from "@ucdjs-internal/worker-utils";
import { UnicodeReportSummarySchema } from "@ucdjs/schemas";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";

const UnicodeReportSummaryListSchema = z.array(UnicodeReportSummarySchema);

const LIST_REPORTS_ROUTE = createRoute({
  method: "get",
  path: "/",
  operationId: "listReports",
  "x-ucd-client-method": "reports.list",
  tags: [OPENAPI_TAGS.REPORTS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_reports:list",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`,
    }),
  ],
  description: dedent`
    List Unicode reports with adjacent revision metadata.

    Each entry includes the current revision exposed by the Unicode reports site,
    the prior revision when available, and the next proposed revision when one exists.
  `,
  responses: {
    200: {
      description: "List of Unicode reports",
      content: {
        "application/json": {
          schema: UnicodeReportSummaryListSchema,
        },
      },
    },
    ...(generateReferences([
      500,
      502,
    ])),
  },
});

export function registerListReportsRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(LIST_REPORTS_ROUTE, async (c) => {
    const reports = await listUnicodeReports();
    return c.json(reports, 200);
  });
}

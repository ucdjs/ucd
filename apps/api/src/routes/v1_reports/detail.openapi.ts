import { createRoute } from "@hono/zod-openapi";
import { MAX_AGE_ONE_WEEK_SECONDS } from "@ucdjs-internal/worker-utils";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { REPORT_ID_PARAM, UnicodeReportRevisionMetadataSchema } from "./shared";

export const GET_REPORT_ROUTE = createRoute({
  "method": "get",
  "path": "/{reportId}",
  "operationId": "getReport",
  "x-ucd-client-method": "reports.get",
  "tags": [OPENAPI_TAGS.REPORTS],
  "middleware": [
    cache({
      cacheName: "ucdjs:v1_reports:report",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`,
    }),
  ],
  "parameters": [
    REPORT_ID_PARAM,
  ],
  "description": "Resolve a report id to its latest revision metadata.",
  "responses": {
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

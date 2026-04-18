import { createRoute } from "@hono/zod-openapi";
import { MAX_AGE_ONE_WEEK_SECONDS } from "@ucdjs-internal/worker-utils";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import {
  REPORT_ID_PARAM,
  REVISION_ID_PARAM,
  UnicodeReportRevisionMetadataSchema,
} from "./shared";

export const GET_REPORT_REVISION_ROUTE = createRoute({
  method: "get",
  path: "/{reportId}/rev/{revId}",
  operationId: "getReportRevision",
  "x-ucd-client-method": "reports.getRevision",
  tags: [OPENAPI_TAGS.REPORTS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_reports:revision",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`,
    }),
  ],
  parameters: [
    REPORT_ID_PARAM,
    REVISION_ID_PARAM,
  ],
  description: "Fetch metadata for a specific report revision without downloading the HTML document.",
  responses: {
    200: {
      description: "Unicode report revision metadata",
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

import { createRoute, z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { MAX_AGE_ONE_WEEK_SECONDS } from "@ucdjs-internal/worker-utils";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { REPORT_ID_PARAM, REVISION_ID_PARAM } from "./shared";

export const GET_REPORT_RAW_ROUTE = createRoute({
  "method": "get",
  "path": "/{reportId}/rev/{revId}/raw",
  "operationId": "getReportRaw",
  "x-ucd-client-method": "reports.getRaw",
  "tags": [OPENAPI_TAGS.REPORTS],
  "middleware": [
    cache({
      cacheName: "ucdjs:v1_reports:raw",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`,
    }),
  ],
  "parameters": [
    REPORT_ID_PARAM,
    REVISION_ID_PARAM,
  ],
  "description": dedent`
    Fetch the raw upstream HTML document for a specific Unicode report revision.

    This returns the original document body without preview sanitization.
  `,
  "responses": {
    200: {
      description: "Raw HTML report document",
      content: {
        "text/html": {
          schema: z.string(),
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

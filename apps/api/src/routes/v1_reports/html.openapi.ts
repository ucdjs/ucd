import { createRoute, z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { MAX_AGE_ONE_WEEK_SECONDS } from "@ucdjs-internal/worker-utils";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { REPORT_ID_PARAM, REVISION_ID_PARAM } from "./shared";

export const GET_REPORT_HTML_ROUTE = createRoute({
  method: "get",
  path: "/{reportId}/rev/{revId}/html",
  operationId: "getReportHtml",
  "x-ucd-client-method": "reports.getHtml",
  tags: [OPENAPI_TAGS.REPORTS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_reports:html",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`,
    }),
  ],
  parameters: [
    REPORT_ID_PARAM,
    REVISION_ID_PARAM,
  ],
  description: dedent`
    Fetch the sanitized preview HTML document for a specific Unicode report revision.

    Numeric revisions map to archived report files. The special \`proposed\`
    revision maps to the latest proposed update when one exists.
  `,
  responses: {
    200: {
      description: "HTML report document",
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

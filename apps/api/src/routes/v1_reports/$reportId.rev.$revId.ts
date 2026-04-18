import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { StatusCode } from "hono/utils/http-status";
import {
  getUnicodeReportHtml,
  getUnicodeReportRawHtml,
  getUnicodeReportRevisionMetadata,
  isValidReportId,
} from "#lib/reports";
import { createRoute, z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { badRequest, customError, MAX_AGE_ONE_WEEK_SECONDS, notFound } from "@ucdjs-internal/worker-utils";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import {
  NUMERIC_REVISION_ID_RE,
  REPORT_ID_PARAM,
  REVISION_ID_PARAM,
  UnicodeReportRevisionMetadataSchema,
} from "./shared";

const GET_REPORT_REVISION_ROUTE = createRoute({
  method: "get",
  path: "/{reportId}/rev/{revId}",
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

const GET_REPORT_HTML_ROUTE = createRoute({
  method: "get",
  path: "/{reportId}/rev/{revId}/html",
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

const GET_REPORT_RAW_ROUTE = createRoute({
  method: "get",
  path: "/{reportId}/rev/{revId}/raw",
  tags: [OPENAPI_TAGS.REPORTS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_reports:raw",
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`,
    }),
  ],
  parameters: [
    REPORT_ID_PARAM,
    REVISION_ID_PARAM,
  ],
  description: dedent`
    Fetch the raw upstream HTML document for a specific Unicode report revision.

    This returns the original document body without preview sanitization.
  `,
  responses: {
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

export function registerGetReportHtmlRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_REPORT_HTML_ROUTE, async (c) => {
    const reportId = c.req.param("reportId");
    const revId = c.req.param("revId");

    const { body, headers, status } = await getUnicodeReportHtml(c.env.UCD_BUCKET, reportId, revId);
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

import type { HonoEnv } from "#types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { V1_REPORTS_ROUTER_BASE_PATH } from "../../constants";
import { registerGetReportRoute } from "./detail.handler";
import { registerGetReportHtmlRoute } from "./html.handler";
import { registerListReportsRoute } from "./list";
import { registerGetReportRawRoute } from "./raw.handler";
import { registerGetReportRevisionRoute } from "./revision.handler";

export const V1_REPORTS_ROUTER = new OpenAPIHono<HonoEnv>().basePath(V1_REPORTS_ROUTER_BASE_PATH);

registerListReportsRoute(V1_REPORTS_ROUTER);
registerGetReportRoute(V1_REPORTS_ROUTER);
registerGetReportRevisionRoute(V1_REPORTS_ROUTER);
registerGetReportHtmlRoute(V1_REPORTS_ROUTER);
registerGetReportRawRoute(V1_REPORTS_ROUTER);

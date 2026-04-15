import type { HonoEnv } from "#types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { V1_REPORTS_ROUTER_BASE_PATH } from "../../constants";
import { registerGetReportRoute } from "./$reportId";
import { registerGetReportHtmlRoute, registerGetReportRevisionRoute } from "./$reportId.rev.$revId";
import { registerListReportsRoute } from "./list";

export const V1_REPORTS_ROUTER = new OpenAPIHono<HonoEnv>().basePath(V1_REPORTS_ROUTER_BASE_PATH);

registerListReportsRoute(V1_REPORTS_ROUTER);
registerGetReportRoute(V1_REPORTS_ROUTER);
registerGetReportRevisionRoute(V1_REPORTS_ROUTER);
registerGetReportHtmlRoute(V1_REPORTS_ROUTER);

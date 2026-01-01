import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { V1_VERSIONS_ROUTER_BASE_PATH } from "../../constants";
import { registerVersionFileTreeRoute } from "./$version/file-tree";
import { registerGetVersionRoute } from "./$version/get";
import { registerListVersionsRoute } from "./list";

export const V1_VERSIONS_ROUTER = new OpenAPIHono<HonoEnv>().basePath(V1_VERSIONS_ROUTER_BASE_PATH);

registerListVersionsRoute(V1_VERSIONS_ROUTER);
registerGetVersionRoute(V1_VERSIONS_ROUTER);
registerVersionFileTreeRoute(V1_VERSIONS_ROUTER);

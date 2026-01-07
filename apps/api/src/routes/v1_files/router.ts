import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { V1_FILES_ROUTER_BASE_PATH } from "../../constants";
import { registerWildcardRoute } from "./$wildcard";

export const V1_FILES_ROUTER = new OpenAPIHono<HonoEnv>().basePath(V1_FILES_ROUTER_BASE_PATH);

registerWildcardRoute(V1_FILES_ROUTER);

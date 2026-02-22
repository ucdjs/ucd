import type { HonoEnv } from "#types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { V1_FILES_ROUTER_BASE_PATH } from "../../constants";
import { registerWildcardRoute } from "./$wildcard";
import { registerShikiRoute } from "./shiki";

export const V1_FILES_ROUTER = new OpenAPIHono<HonoEnv>().basePath(V1_FILES_ROUTER_BASE_PATH);

registerShikiRoute(V1_FILES_ROUTER);
registerWildcardRoute(V1_FILES_ROUTER);

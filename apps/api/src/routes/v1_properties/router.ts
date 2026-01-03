import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { V1_PROPERTIES_ROUTER_BASE_PATH } from "../../constants";
import { registerPropertyRoute } from "./$property";

export const V1_PROPERTIES_ROUTER = new OpenAPIHono<HonoEnv>().basePath(V1_PROPERTIES_ROUTER_BASE_PATH);

registerPropertyRoute(V1_PROPERTIES_ROUTER);

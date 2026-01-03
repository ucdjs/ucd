import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { V1_BLOCKS_ROUTER_BASE_PATH } from "../../constants";
import { registerBlockRoute } from "./$block";
import { registerBlocksListRoute } from "./list";

export const V1_BLOCKS_ROUTER = new OpenAPIHono<HonoEnv>().basePath(V1_BLOCKS_ROUTER_BASE_PATH);

registerBlocksListRoute(V1_BLOCKS_ROUTER);
registerBlockRoute(V1_BLOCKS_ROUTER);

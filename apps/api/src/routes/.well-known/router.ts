import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { WELL_KNOWN_ROUTER_BASE_PATH } from "../../constants";
import { registerUcdConfigRoute } from "./ucd-config.json";
import { registerUcdStoreRoute } from "./ucd-store.json";

export const WELL_KNOWN_ROUTER = new OpenAPIHono<HonoEnv>().basePath(WELL_KNOWN_ROUTER_BASE_PATH);

registerUcdConfigRoute(WELL_KNOWN_ROUTER);
registerUcdStoreRoute(WELL_KNOWN_ROUTER);

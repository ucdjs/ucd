import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import {
  V1_FILES_ROUTER_BASE_PATH,
  V1_VERSIONS_ROUTER_BASE_PATH,
  WELL_KNOWN_ROUTER_BASE_PATH,
} from "../../constants";
import { UCD_CONFIG_ROUTE } from "./openapi";

export const WELL_KNOWN_ROUTER = new OpenAPIHono<HonoEnv>().basePath(WELL_KNOWN_ROUTER_BASE_PATH);

WELL_KNOWN_ROUTER.openapi(UCD_CONFIG_ROUTE, (c) => {
  return c.json({
    version: "1.0",
    endpoints: {
      files: V1_FILES_ROUTER_BASE_PATH,
      manifest: `${V1_FILES_ROUTER_BASE_PATH}/.ucd-store.json`,
      versions: V1_VERSIONS_ROUTER_BASE_PATH,
    },
  });
});

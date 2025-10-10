import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { V1_FILES_ROUTER } from "../v1_files/routes";
import { V1_VERSIONS_ROUTER } from "../v1_versions/routes";
import { UCD_CONFIG_ROUTE } from "./openapi";

export const WELL_KNOWN_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/.well-known");

WELL_KNOWN_ROUTER.openapi(UCD_CONFIG_ROUTE, (c) => {
  const getBasePath = (router: OpenAPIHono<any, any, any>) => {
    return router
      // @ts-expect-error accessing private property
      ._basePath;
  };

  return c.json({
    version: "1.0",
    endpoints: {
      files: getBasePath(V1_FILES_ROUTER),
      manifest: `${getBasePath(V1_FILES_ROUTER)}/.ucd-store.json`,
      versions: getBasePath(V1_VERSIONS_ROUTER),
    },
  });
});

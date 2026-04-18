import type { UnicodeAssetOptions } from "#lib/files";
import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { StatusCode } from "hono/utils/http-status";
import { getUnicodeAsset } from "#lib/files";
import { customError, MAX_AGE_ONE_WEEK_SECONDS } from "@ucdjs-internal/worker-utils";
import { cache } from "hono/cache";
import {
  METADATA_WILDCARD_ROUTE,
  WILDCARD_ROUTE,
} from "./wildcard.openapi";

export function registerWildcardRoute(router: OpenAPIHono<HonoEnv>) {
  router.openAPIRegistry.registerPath(WILDCARD_ROUTE);
  router.openAPIRegistry.registerPath(METADATA_WILDCARD_ROUTE);

  router.get(
    "/:wildcard{.*}?",
    cache({
      cacheName: (c) => `ucdjs:v1_files:files${c.req.method === "HEAD" ? ":head" : ":get"}`,
      cacheControl: `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`, // 7 days
    }),
    async (c) => {
      const path = c.req.param("wildcard")?.trim() || "";
      const handlerOptions = {
        query: c.req.query("query"),
        pattern: c.req.query("pattern"),
        type: c.req.query("type"),
        sort: c.req.query("sort"),
        order: c.req.query("order"),
        isHeadRequest: c.req.method === "HEAD",
      } satisfies UnicodeAssetOptions;

      const { body, headers, status } = await getUnicodeAsset(path, handlerOptions);

      if (status !== 200) {
        let errorMessage = `Upstream responded with status ${status}`;
        if (typeof body === "string") {
          try {
            const errorBody = JSON.parse(body);
            if (errorBody.message) {
              errorMessage = errorBody.message;
            }
          } catch {
          }
        }

        return customError(c, {
          status,
          message: errorMessage,
          headers,
        });
      }

      return c.newResponse(body, status as StatusCode, headers);
    },
  );
}

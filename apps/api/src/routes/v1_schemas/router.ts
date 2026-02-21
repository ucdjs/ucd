import type { HonoEnv } from "#types";
import { tryOr } from "@ucdjs-internal/shared";
import { MAX_AGE_ONE_DAY_SECONDS } from "@ucdjs-internal/worker-utils";
import { LockfileSchema, SnapshotSchema } from "@ucdjs/schemas";
import { Hono } from "hono";
import { cache } from "hono/cache";
import { z } from "zod";
import {
  V1_SCHEMAS_ROUTER_BASE_PATH,
} from "../../constants";

export const V1_SCHEMAS_ROUTER = new Hono<HonoEnv>().basePath(V1_SCHEMAS_ROUTER_BASE_PATH);

const schemas = [
  { name: "lockfile", schema: LockfileSchema },
  { name: "snapshot", schema: SnapshotSchema },
] as const;

for (const { name, schema } of schemas) {
  V1_SCHEMAS_ROUTER.get(
    `/${name}.json`,
    cache({
      cacheName: `ucdjs:v1_schemas:${name}`,
      cacheControl: `max-age=${MAX_AGE_ONE_DAY_SECONDS * 4}`, // 4 days
    }),
    async (c) => {
      const jsonSchema = await tryOr({
        try: () => z.toJSONSchema(schema, {
          unrepresentable: "any",
          override: (ctx) => {
            const def = ctx.zodSchema._zod.def;
            if (def.type === "date") {
              ctx.jsonSchema.type = "string";
              ctx.jsonSchema.format = "date-time";
            }
          },
        }),
        err: (err) => {
          console.error(`Failed to generate JSON schema for ${name}:`, err);
          throw err;
        },
      });

      return c.json(jsonSchema, 200);
    },
  );
}

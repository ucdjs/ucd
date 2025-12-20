import type { HonoEnv } from "../../types";
import { LockfileSchema, SnapshotSchema } from "@ucdjs/schemas";
import { Hono } from "hono";
import { cache } from "hono/cache";
import { z } from "zod";
import { MAX_AGE_ONE_DAY_SECONDS, V1_SCHEMAS_ROUTER_BASE_PATH } from "../../constants";

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
      const jsonSchema = z.toJSONSchema(schema);
      return c.json(jsonSchema, 200);
    },
  );
}

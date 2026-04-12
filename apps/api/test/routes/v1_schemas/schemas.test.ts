/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import type { JSONSchema } from "zod/v4/core";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";

describe("v1_schemas", () => {
  describe.each([
    {
      name: "lockfile",
      path: "https://api.ucdjs.dev/api/v1/schemas/lockfile.json",
    },
    {
      name: "snapshot",
      path: "https://api.ucdjs.dev/api/v1/schemas/snapshot.json",
    },
    // eslint-disable-next-line test/prefer-lowercase-title
  ])("GET /api/v1/schemas/$name.json", ({ name, path }) => {
    it(`returns the ${name} schema with stable cacheable output`, async () => {
      const { response: firstResponse, json: firstJson } = await executeRequest(
        new Request(path),
        env,
      );
      const { response: secondResponse, json: secondJson } = await executeRequest(
        new Request(path),
        env,
      );

      expect(firstResponse).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
      });
      expect(secondResponse).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
      });

      expect(firstResponse.headers.get("cache-control")).toMatch(/max-age=345600/);

      const firstSchema = await firstJson<JSONSchema.JSONSchema>();
      const secondSchema = await secondJson<JSONSchema.JSONSchema>();

      expect(firstSchema).toEqual(secondSchema);
      expect(firstSchema.$schema).toMatch(/json-schema\.org/);
      expect(firstSchema.type).toBe("object");
      expect(firstSchema.properties).toBeDefined();
    });
  });

  describe("schema comparison", () => {
    it("returns different schemas for lockfile and snapshot", async () => {
      const { json: lockfileJson } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/lockfile.json"),
        env,
      );
      const { json: snapshotJson } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/snapshot.json"),
        env,
      );

      const lockfileSchema = await lockfileJson<JSONSchema.JSONSchema>();
      const snapshotSchema = await snapshotJson<JSONSchema.JSONSchema>();

      expect(lockfileSchema).not.toEqual(snapshotSchema);
    });
  });

  describe("404 for non-existent schemas", () => {
    it.each([
      {
        label: "unknown schema",
        path: "https://api.ucdjs.dev/api/v1/schemas/nonexistent.json",
      },
      {
        label: "schema without .json extension",
        path: "https://api.ucdjs.dev/api/v1/schemas/lockfile",
      },
    ])("returns 404 for $label", async ({ path }) => {
      const { response } = await executeRequest(
        new Request(path),
        env,
      );

      expect(response.status).toBe(404);
    });
  });
});

/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import type { JSONSchema } from "zod/v4/core";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";

describe("v1_schemas", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/schemas/lockfile.json", () => {
    it("should return lockfile JSON schema", async () => {
      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/lockfile.json"),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
      });

      const schema = await json<JSONSchema.JSONSchema>();

      // Verify it's a valid JSON Schema
      expect(schema).toHaveProperty("$schema");
      expect(schema).toHaveProperty("type");

      // Should be an object schema
      expect(schema.type).toBe("object");
    });

    it("should have proper cache control headers", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/lockfile.json"),
        env,
      );

      expect(response).toMatchResponse({
        cache: true,
      });
      const cacheControl = response.headers.get("cache-control");

      // Should have 4 days cache (from router: MAX_AGE_ONE_DAY_SECONDS * 4)
      expect(cacheControl).toMatch(/max-age=345600/); // 86400 * 4
    });

    it("should return consistent schema on multiple requests", async () => {
      const { json: json1 } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/lockfile.json"),
        env,
      );

      const { json: json2 } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/lockfile.json"),
        env,
      );

      const schema1 = await json1<JSONSchema.JSONSchema>();
      const schema2 = await json2<JSONSchema.JSONSchema>();

      expect(schema1).toEqual(schema2);
    });

    it("should have expected lockfile schema properties", async () => {
      const { json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/lockfile.json"),
        env,
      );

      const schema = await json<JSONSchema.JSONSchema>();

      // Lockfile should have properties like version, files, etc.
      expect(schema).toHaveProperty("properties");
      expect(schema.properties).toBeDefined();
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/schemas/snapshot.json", () => {
    it("should return snapshot JSON schema", async () => {
      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/snapshot.json"),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
      });

      const schema = await json<JSONSchema.JSONSchema>();

      // Verify it's a valid JSON Schema
      expect(schema).toHaveProperty("$schema");
      expect(schema).toHaveProperty("type");

      // Should be an object schema
      expect(schema.type).toBe("object");
    });

    it("should have proper cache control headers", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/snapshot.json"),
        env,
      );

      expect(response).toMatchResponse({
        cache: true,
      });
      const cacheControl = response.headers.get("cache-control");

      // Should have 4 days cache (from router: MAX_AGE_ONE_DAY_SECONDS * 4)
      expect(cacheControl).toMatch(/max-age=345600/); // 86400 * 4
    });

    it("should return consistent schema on multiple requests", async () => {
      const { json: json1 } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/snapshot.json"),
        env,
      );

      const { json: json2 } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/snapshot.json"),
        env,
      );

      const schema1 = await json1<JSONSchema.JSONSchema>();
      const schema2 = await json2<JSONSchema.JSONSchema>();

      expect(schema1).toEqual(schema2);
    });

    it("should have expected snapshot schema properties", async () => {
      const { json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/snapshot.json"),
        env,
      );

      const schema = await json<JSONSchema.JSONSchema>();

      // Snapshot should have properties
      expect(schema).toHaveProperty("properties");
      expect(schema.properties).toBeDefined();
    });
  });

  describe("schema comparison", () => {
    it("should return different schemas for lockfile and snapshot", async () => {
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

      // Schemas should be different
      expect(lockfileSchema).not.toEqual(snapshotSchema);
    });
  });

  describe("404 for non-existent schemas", () => {
    it("should return 404 for unknown schema", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/nonexistent.json"),
        env,
      );

      expect(response.status).toBe(404);
    });

    it("should return 404 for schema without .json extension", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/lockfile"),
        env,
      );

      expect(response.status).toBe(404);
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("JSON Schema structure validation", () => {
    it("should have valid JSON Schema $schema property", async () => {
      const { json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/lockfile.json"),
        env,
      );

      const schema = await json<JSONSchema.JSONSchema>();

      expect(schema.$schema).toBeDefined();
      expect(typeof schema.$schema).toBe("string");
      // Should be a JSON Schema draft URL
      expect(schema.$schema).toMatch(/json-schema\.org/);
    });

    it("should convert Zod schema to valid JSON Schema format", async () => {
      const { json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/schemas/snapshot.json"),
        env,
      );

      const schema = await json<JSONSchema.JSONSchema>();

      // Basic JSON Schema validation
      expect(schema).toHaveProperty("type");
      expect(["object", "string", "number", "boolean", "array", "null"]).toContain(schema.type);
    });
  });
});

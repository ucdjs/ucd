import { UCDWellKnownConfigSchema } from "@ucdjs/schemas";
import {
  createExecutionContext,
  env,
  fetchMock,
  waitOnExecutionContext,
} from "cloudflare:test";

import { afterEach, beforeAll, describe, expect, it } from "vitest";
import worker from "../../src/worker";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
});

describe("well-known", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /ucd-config.json", () => {
    it("should return UCD config successfully", async () => {
      const request = new Request("https://api.ucdjs.dev/.well-known/ucd-config.json");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect.soft(response.headers.get("content-type")).toBe("application/json");
      expect.soft(response.headers.get("cache-control")).toMatch(/max-age=\d+/);

      const json = await response.json();

      // TODO: make use of custom matcher
      // expect(json).toMatchSchema(UCDWellKnownConfigSchema);

      const result = UCDWellKnownConfigSchema.safeParse(json);

      if (!result.success) {
        expect.fail("Response does not match UCDWellKnownConfigSchema");
      }
    });
  });
});

import type { OpenAPIObjectConfig } from "../src/openapi";
import {
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { assert, describe, expect, it } from "vitest";
import worker from "../src/worker";

describe("error handling", () => {
  const testWorker = worker.route("/", new Hono()
    .get("/__test_error", () => {
      throw new HTTPException(500, {
        message: "Test error",
      });
    })
    .get("/__test_not_found", () => {
      throw new HTTPException(404, {
        message: "Not Found",
      });
    }));

  it("respond with a 404", async () => {
    const request = new Request("https://api.ucdjs.dev/__test_not_found");
    const ctx = createExecutionContext();
    const response = await testWorker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      message: "Not Found",
      status: 404,
      timestamp: expect.any(String),
    });
  });

  it("respond with a 500 on fetch error", async () => {
    const request = new Request("https://api.ucdjs.dev/__test_error");
    const ctx = createExecutionContext();
    const response = await testWorker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Test error",
      status: 500,
      timestamp: expect.any(String),
    });
  });
});

describe.todo("openapi", () => {
  it("should return the OpenAPI spec", async () => {
    const request = new Request("https://api.ucdjs.dev/openapi.json");
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    const json = await response.json() as OpenAPIObjectConfig;
    expect(json).toHaveProperty("openapi");
    expect(json).toHaveProperty("info");
    expect(json.info).toHaveProperty("title", "UCD.js API");
  });

  it("should return the OpenAPI spec with custom server URL", async () => {
    const request = new Request("https://api.ucdjs.dev/openapi.json");
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, {
      ...env,
      ENVIRONMENT: "preview",
    }, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const json = await response.json() as OpenAPIObjectConfig;
    expect(json.servers).toHaveLength(1);
    assert(json.servers);
    expect(json.servers[0]).toEqual({
      url: "https://preview.api.ucdjs.dev",
      description: "Preview Environment",
    });
  });
});

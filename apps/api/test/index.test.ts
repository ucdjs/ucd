import type { OpenAPIObjectConfig } from "../src/openapi";
import { env } from "cloudflare:workers";
import { assert, describe, expect, it } from "vitest";
import { executeRequest } from "./helpers/request";

describe("error handling", () => {
  it("respond with a 404", async () => {
    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/non-existent-route"),
      env,
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      message: "Not Found",
      status: 404,
      timestamp: expect.any(String),
    });
  });
});

describe.todo("openapi", () => {
  it("should return the OpenAPI spec", async () => {
    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/openapi.json"),
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    const json = await response.json() as OpenAPIObjectConfig;
    expect(json).toHaveProperty("openapi");
    expect(json).toHaveProperty("info");
    expect(json.info).toHaveProperty("title", "UCD.js API");
  });

  it("should return the OpenAPI spec with custom server URL", async () => {
    const { response } = await executeRequest(
      new Request("https://api.ucdjs.dev/openapi.json"),
      {
        ...env,
        ENVIRONMENT: "preview",
      },
    );

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

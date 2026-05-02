import type { OpenAPIObjectConfig } from "../src/openapi";
import { env } from "cloudflare:workers";
import { assert, describe, expect, it } from "vitest";
import { executeRequest } from "./helpers/request";

describe("root", () => {
  it("responds with the endpoint map when HTML is not accepted", async () => {
    const { response, json } = await executeRequest(
      new Request("https://api.ucdjs.dev/", {
        headers: {
          accept: "application/json",
        },
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await json()).toEqual({
      versions_url: "https://api.ucdjs.dev/api/v1/versions",
      files_url: "https://api.ucdjs.dev/api/v1/files",
      reports_url: "https://api.ucdjs.dev/api/v1/reports",
      well_known_url: "https://api.ucdjs.dev/.well-known/ucd-config.json",
      openapi_url: "https://api.ucdjs.dev/openapi.json",
    });
  });

  it("responds with Scalar when HTML is accepted", async () => {
    const { response, text } = await executeRequest(
      new Request("https://api.ucdjs.dev/", {
        headers: {
          accept: "text/html,application/json",
        },
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await text()).toContain("/openapi.json");
  });
});

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

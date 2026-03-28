import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "./helpers/request";

describe("store root", () => {
  it("returns service metadata", async () => {
    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/"),
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");

    const payload = await json<{ name: string; endpoints: Record<string, string> }>();
    expect(payload.name).toBe("UCD Store API");
    expect(payload.endpoints).toMatchObject({
      lockfile: "GET /.ucd-store.lock",
      snapshot: "GET /{version}/snapshot.json",
      files: "GET /{version}/{filepath}",
    });
  });

  it("returns a 400 when only a version is provided", async () => {
    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/17.0.0"),
      env,
    );

    expect(response.status).toBe(400);

    const payload = await json<{ status: number; message: string }>();
    expect(payload.status).toBe(400);
    expect(payload.message).toContain("file path is required");
  });
});

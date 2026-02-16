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
});

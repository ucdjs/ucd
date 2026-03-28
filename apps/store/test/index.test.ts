import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
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

  it("treats a bare version path as the version root directory", async () => {
    const filesMock = vi.fn(async () => {
      return {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        kind: "directory",
        body: JSON.stringify([{ name: "Blocks.txt" }]),
      };
    });

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/17.0.0"),
      {
        ...env,
        UCDJS_API: {
          files: filesMock,
        },
      } as unknown as Cloudflare.Env,
    );

    expect(response.status).toBe(200);
    expect(await json()).toEqual([{ name: "Blocks.txt" }]);
    expect(filesMock).toHaveBeenCalledWith("17.0.0/ucd", {
      query: undefined,
      pattern: undefined,
      type: undefined,
      sort: undefined,
      order: undefined,
      isHeadRequest: false,
      stripUCDPrefix: true,
    });
  });
});

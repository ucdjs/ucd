import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { executeRequest } from "../helpers/request";

describe("store files route", () => {
  // We can't use mockFetch to block, these API calls.
  // Since the API Worker is running as an auxiliary Worker, and therefore cannot be changed.
  //
  // Since it runs in a separate thread.
  it("delegates to UCDJS_API.files with stripUCDPrefix enabled", async () => {
    const filesMock = vi.fn(async () => {
      return {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "x-test": "ok",
        },
        kind: "directory",
        body: JSON.stringify([{ name: "Blocks.txt" }]),
      };
    });

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/17.0.0/Blocks.txt?query=Blo"),
      {
        ...env,
        UCDJS_API: {
          files: filesMock,
        },
      } as unknown as Cloudflare.Env,
    );

    expect(response.headers.get("x-test")).toBe("ok");
    expect(await json()).toEqual([{ name: "Blocks.txt" }]);

    expect(filesMock).toHaveBeenCalledTimes(1);
    expect(filesMock).toHaveBeenCalledWith("17.0.0/ucd/Blocks.txt", {
      query: "Blo",
      pattern: undefined,
      type: undefined,
      sort: undefined,
      order: undefined,
      isHeadRequest: false,
      stripUCDPrefix: true,
    });
  });
});

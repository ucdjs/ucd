import { HttpResponse, mockFetch } from "#test-utils/msw";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../helpers/request";

describe("store files route", () => {
  it("delegates to UCDJS_API.files with stripUCDPrefix enabled", async () => {
    mockFetch([
      ["GET", "https://unicode.org/Public/17.0.0/ucd/Blocks.txt", () => {
        return HttpResponse.text("Mock Blocks.txt content");
      }],
    ]);

    const { response, text } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/17.0.0/Blocks.txt"),
      env,
    );

    expect(response.status).toBe(200);
    expect(await text()).toEqual("Mock Blocks.txt content");
  });
});

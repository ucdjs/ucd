import { encodeBase64 } from "#test-utils";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import { github } from "../../src/remote/index";

describe("github provider", () => {
  it("listFiles should return blob paths", async () => {
    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/git/trees/main",
        () => HttpResponse.json({
          tree: [
            { path: "pipelines/alpha.ucd-pipeline.ts", type: "blob" },
            { path: "pipelines/nested", type: "tree" },
          ],
          truncated: false,
        }),
      ],
    ]);

    const result = await github.listFiles({ owner: "ucdjs", repo: "demo-pipelines", ref: "main" });

    expect(result.files).toEqual(["pipelines/alpha.ucd-pipeline.ts"]);
    expect(result.truncated).toBe(false);
  });

  it("fetchFile should decode base64 content", async () => {
    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/contents/pipelines%2Falpha.ucd-pipeline.ts",
        () => HttpResponse.json({
          content: encodeBase64("export const alpha = 'alpha';"),
          encoding: "base64",
        }),
      ],
    ]);

    const result = await github.fetchFile(
      { owner: "ucdjs", repo: "demo-pipelines", ref: "main" },
      "pipelines/alpha.ucd-pipeline.ts",
    );

    expect(result).toBe("export const alpha = 'alpha';");
  });
});

import { HttpResponse, mockFetch } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import { gitlab } from "../../src/remote/index";

describe("gitlab provider", () => {
  it("listFiles should return blob paths", async () => {
    mockFetch([
      [
        "GET",
        "https://gitlab.com/api/v4/projects/ucdjs%2Fdemo-pipelines/repository/tree",
        () => HttpResponse.json([
          { path: "pipelines/alpha.ucd-pipeline.ts", type: "blob" },
          { path: "pipelines/nested", type: "tree" },
        ]),
      ],
    ]);

    const result = await gitlab.listFiles({ owner: "ucdjs", repo: "demo-pipelines", ref: "main" });

    expect(result.files).toEqual(["pipelines/alpha.ucd-pipeline.ts"]);
    expect(result.truncated).toBe(false);
  });

  it("fetchFile should return raw content", async () => {
    mockFetch([
      [
        "GET",
        "https://gitlab.com/api/v4/projects/ucdjs%2Fdemo-pipelines/repository/files/pipelines%2Falpha.ucd-pipeline.ts/raw",
        () => HttpResponse.text("export const alpha = 'alpha';"),
      ],
    ]);

    const result = await gitlab.fetchFile(
      { owner: "ucdjs", repo: "demo-pipelines", ref: "main" },
      "pipelines/alpha.ucd-pipeline.ts",
    );

    expect(result).toBe("export const alpha = 'alpha';");
  });
});

import { HttpResponse, mockFetch } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import { findRemotePipelineFiles } from "../../src/remote/index";

describe("findRemotePipelineFiles", () => {
  it("should list GitHub files and apply path + pattern filtering", async () => {
    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/git/trees/main",
        () => HttpResponse.json({
          tree: [
            { path: "pipelines/alpha.ucd-pipeline.ts", type: "blob" },
            { path: "pipelines/notes.txt", type: "blob" },
            { path: "other/beta.ucd-pipeline.ts", type: "blob" },
            { path: "pipelines/subdir", type: "tree" },
          ],
          truncated: false,
        }),
      ],
    ]);

    const result = await findRemotePipelineFiles({
      type: "github",
      id: "demo-pipelines",
      owner: "ucdjs",
      repo: "demo-pipelines",
      ref: "main",
      path: "pipelines",
    });

    expect(result.files).toEqual(["pipelines/alpha.ucd-pipeline.ts"]);
    expect(result.truncated).toBe(false);
  });

  it("should list GitLab files and apply pattern filtering", async () => {
    mockFetch([
      [
        "GET",
        "https://gitlab.com/api/v4/projects/ucdjs%2Fdemo-pipelines/repository/tree",
        () => HttpResponse.json([
          { path: "pipelines/alpha.ucd-pipeline.ts", type: "blob" },
          { path: "pipelines/notes.txt", type: "blob" },
          { path: "pipelines/subdir", type: "tree" },
        ]),
      ],
    ]);

    const result = await findRemotePipelineFiles({
      type: "gitlab",
      id: "demo-pipelines",
      owner: "ucdjs",
      repo: "demo-pipelines",
      ref: "main",
      path: "pipelines",
    });

    expect(result.files).toEqual(["pipelines/alpha.ucd-pipeline.ts"]);
    expect(result.truncated).toBe(false);
  });
});

import { existsSync } from "node:fs";
import { join } from "node:path";
import { encodeBase64 } from "#test-utils";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { downloadPipelineFile, downloadPipelineProject } from "../../src/remote/index";

describe("downloadPipelineProject", () => {
  it("should materialize a remote repository", async () => {
    const workdir = await testdir();

    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/git/trees/main",
        () => HttpResponse.json({
          tree: [
            { path: "pipelines/alpha.ucd-pipeline.ts", type: "blob" },
          ],
          truncated: false,
        }),
      ],
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/contents/pipelines%2Falpha.ucd-pipeline.ts",
        () => HttpResponse.json({
          content: encodeBase64("export const alpha = 'alpha';"),
          encoding: "base64",
        }),
      ],
    ]);

    const result = await downloadPipelineProject(
      {
        type: "github",
        id: "demo-pipelines",
        owner: "ucdjs",
        repo: "demo-pipelines",
        ref: "main",
      },
      { workdir },
    );

    expect(result.workdir).toBe(workdir);
    expect(result.files).toEqual(["pipelines/alpha.ucd-pipeline.ts"]);
    expect(existsSync(join(workdir, "pipelines", "alpha.ucd-pipeline.ts"))).toBe(true);
  });
});

describe("downloadPipelineFile", () => {
  it("should materialize a single file", async () => {
    const workdir = await testdir();

    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/git/trees/main",
        () => HttpResponse.json({
          tree: [
            { path: "pipelines/alpha.ucd-pipeline.ts", type: "blob" },
          ],
          truncated: false,
        }),
      ],
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/contents/pipelines%2Falpha.ucd-pipeline.ts",
        () => HttpResponse.json({
          content: encodeBase64("export const alpha = 'alpha';"),
          encoding: "base64",
        }),
      ],
    ]);

    const result = await downloadPipelineFile(
      {
        type: "github",
        id: "demo-pipelines",
        owner: "ucdjs",
        repo: "demo-pipelines",
        ref: "main",
      },
      "pipelines/alpha.ucd-pipeline.ts",
      { workdir },
    );

    expect(result.workdir).toBe(workdir);
    expect(result.filePath).toBe("pipelines/alpha.ucd-pipeline.ts");
    expect(existsSync(join(workdir, "pipelines", "alpha.ucd-pipeline.ts"))).toBe(true);
  });
});

import path from "node:path";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { discoverPipelineFiles } from "../src/discover";

describe("discoverPipelineFiles", () => {
  it("finds files within a local materialized repository path", async () => {
    const dir = await testdir({
      pipelines: {
        "alpha.ucd-pipeline.ts": "",
        "nested": {
          "beta.ucd-pipeline.ts": "",
        },
      },
    });

    const discovered = await discoverPipelineFiles({
      repositoryPath: path.join(dir, "pipelines"),
    });

    expect(discovered.issues).toEqual([]);
    expect(discovered.files.map((file) => file.relativePath).sort()).toEqual([
      "alpha.ucd-pipeline.ts",
      "nested/beta.ucd-pipeline.ts",
    ]);
  });

  it("supports custom patterns", async () => {
    const dir = await testdir({
      pipelines: {
        "alpha.ucd-pipeline.ts": "",
        "beta.custom.ts": "",
      },
    });

    const discovered = await discoverPipelineFiles({
      repositoryPath: path.join(dir, "pipelines"),
      patterns: "**/*.custom.ts",
    });

    expect(discovered.issues).toEqual([]);
    expect(discovered.files).toHaveLength(1);
    expect(discovered.files[0]?.relativePath).toBe("beta.custom.ts");
  });

  it("includes origin metadata with the discovered relative path", async () => {
    const dir = await testdir({
      pipelines: {
        nested: {
          "alpha.ucd-pipeline.ts": "",
        },
      },
    });

    const discovered = await discoverPipelineFiles({
      repositoryPath: path.join(dir, "pipelines"),
      origin: {
        provider: "github",
        owner: "ucdjs",
        repo: "ucd-pipelines",
        ref: "main",
        path: "pipelines",
      },
    });

    expect(discovered.issues).toEqual([]);
    expect(discovered.files[0]?.origin).toEqual({
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
      path: "pipelines/nested/alpha.ucd-pipeline.ts",
    });
  });

  it("returns an empty result when the repository path does not exist", async () => {
    const dir = await testdir();

    const discovered = await discoverPipelineFiles({
      repositoryPath: path.join(dir, "missing"),
    });

    expect(discovered.files).toEqual([]);
    expect(discovered.issues).toEqual([]);
  });
});

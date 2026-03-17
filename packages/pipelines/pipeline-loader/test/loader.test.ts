import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { loadPipelineFile, loadPipelinesFromPaths } from "../src/loader";

vi.mock("@ucdjs/env", async () => {
  const actual = await vi.importActual("@ucdjs/env");
  return {
    ...actual,
    getUcdConfigPath: vi.fn(),
  };
});

describe("loadPipelineFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("loads a local materialized pipeline file", async () => {
    const dir = await testdir({
      "test.ucd-pipeline.ts": /* ts */`
        export const testPipeline = {
          _type: "pipeline-definition",
          id: "test",
          name: "Test Pipeline",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelineFile(`${dir}/test.ucd-pipeline.ts`);

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.id).toBe("test");
    expect(result.exportNames).toEqual(["testPipeline"]);
  });
});

describe("loadPipelinesFromPaths", () => {
  it("loads multiple materialized files", async () => {
    const dir = await testdir({
      "alpha.ucd-pipeline.ts": /* ts */`
        export const alpha = {
          _type: "pipeline-definition",
          id: "alpha",
          name: "Alpha",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
      "beta.ucd-pipeline.ts": /* ts */`
        export const beta = {
          _type: "pipeline-definition",
          id: "beta",
          name: "Beta",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelinesFromPaths([
      `${dir}/alpha.ucd-pipeline.ts`,
      `${dir}/beta.ucd-pipeline.ts`,
    ]);

    expect(result.issues).toEqual([]);
    expect(result.files).toHaveLength(2);
    expect(result.pipelines.map((pipeline) => pipeline.id).sort()).toEqual(["alpha", "beta"]);
  });

  it("returns issues for failed files without throwing", async () => {
    const dir = await testdir({
      "good.ucd-pipeline.ts": /* ts */`
        export const good = {
          _type: "pipeline-definition",
          id: "good",
          name: "Good",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
      "bad.ucd-pipeline.ts": `
        export const broken = {
      `,
    });

    const result = await loadPipelinesFromPaths([
      `${dir}/good.ucd-pipeline.ts`,
      `${dir}/bad.ucd-pipeline.ts`,
    ]);

    expect(result.files).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.scope).toBe("bundle");
    expect(result.issues[0]?.code).toBe("BUNDLE_TRANSFORM_FAILED");
  });
});

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

  it("loads a pipeline file using the options object", async () => {
    const dir = await testdir({
      "opts.ucd-pipeline.ts": /* ts */`
        export const optsPipeline = {
          _type: "pipeline-definition",
          id: "opts",
          name: "Options Pipeline",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelineFile({
      filePath: `${dir}/opts.ucd-pipeline.ts`,
    });

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.id).toBe("opts");
    expect(result.exportNames).toEqual(["optsPipeline"]);
  });

  it("resolves external packages when marked in bundleOptions", async () => {
    const dir = await testdir({
      "ext.ucd-pipeline.ts": /* ts */`
        import { something } from "@luxass/external-lib";
        export const extPipeline = {
          _type: "pipeline-definition",
          id: "ext",
          name: "External",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelineFile({
      filePath: `${dir}/ext.ucd-pipeline.ts`,
      bundleOptions: {
        external: ["external-lib"],
      },
    });

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.id).toBe("ext");
  });

  it("injects compile-time constants via bundleOptions.define", async () => {
    const dir = await testdir({
      "define.ucd-pipeline.ts": /* ts */`
        const version = __PIPELINE_VERSION__;
        export const definePipeline = {
          _type: "pipeline-definition",
          id: "define-test",
          name: version,
          versions: [version],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelineFile({
      filePath: `${dir}/define.ucd-pipeline.ts`,
      bundleOptions: {
        transform: {
          define: {
            __PIPELINE_VERSION__: JSON.stringify("99.0.0"),
          },
        },
      },
    });

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.name).toBe("99.0.0");
    expect(result.pipelines[0]?.versions).toEqual(["99.0.0"]);
  });

  it("resolves aliased imports via bundleOptions.resolve", async () => {
    const dir = await testdir({
      "alias.ucd-pipeline.ts": /* ts */`
        import { pipelineName } from "@luxass/config";
        export const aliasPipeline = {
          _type: "pipeline-definition",
          id: "alias-test",
          name: pipelineName,
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
      "config.ts": /* ts */`
        export const pipelineName = "Aliased Pipeline";
      `,
    });

    const result = await loadPipelineFile({
      filePath: `${dir}/alias.ucd-pipeline.ts`,
      bundleOptions: {
        resolve: {
          alias: {
            "@my/config": `${dir}/config.ts`,
          },
        },
      },
    });

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.name).toBe("Aliased Pipeline");
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

  it("loads multiple files using the options object", async () => {
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

    const result = await loadPipelinesFromPaths({
      filePaths: [
        `${dir}/alpha.ucd-pipeline.ts`,
        `${dir}/beta.ucd-pipeline.ts`,
      ],
    });

    expect(result.issues).toEqual([]);
    expect(result.files).toHaveLength(2);
    expect(result.pipelines.map((pipeline) => pipeline.id).sort()).toEqual(["alpha", "beta"]);
  });

  it("passes bundleOptions to all files via the options object", async () => {
    const dir = await testdir({
      "a.ucd-pipeline.ts": /* ts */`
        import { something } from "@luxass/shared-external";
        export const a = {
          _type: "pipeline-definition",
          id: "a",
          name: "A",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
      "b.ucd-pipeline.ts": /* ts */`
        import { other } from "@luxass/shared-external";
        export const b = {
          _type: "pipeline-definition",
          id: "b",
          name: "B",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelinesFromPaths({
      filePaths: [
        `${dir}/a.ucd-pipeline.ts`,
        `${dir}/b.ucd-pipeline.ts`,
      ],
      bundleOptions: {
        external: ["shared-external"],
      },
    });

    expect(result.issues).toEqual([]);
    expect(result.files).toHaveLength(2);
    expect(result.pipelines.map((pipeline) => pipeline.id).sort()).toEqual(["a", "b"]);
  });
});

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
    expect(result.issues).toEqual([]);
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
    expect(result.issues).toEqual([]);
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
    expect(result.issues).toEqual([]);
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
    expect(result.issues).toEqual([]);
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
            "@luxass/config": `${dir}/config.ts`,
          },
        },
      },
    });

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.name).toBe("Aliased Pipeline");
    expect(result.issues).toEqual([]);
  });

  it("returns an INVALID_EXPORT issue when a file has no valid named pipeline exports", async () => {
    const dir = await testdir({
      "empty.ucd-pipeline.ts": /* ts */`
        export const notAPipeline = {
          id: "nope",
        };
      `,
    });

    const result = await loadPipelineFile(`${dir}/empty.ucd-pipeline.ts`);

    expect(result.pipelines).toEqual([]);
    expect(result.exportNames).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "INVALID_EXPORT",
      scope: "import",
      filePath: `${dir}/empty.ucd-pipeline.ts`,
    });
  });

  it("returns an INVALID_EXPORT issue when a file only uses a default export", async () => {
    const dir = await testdir({
      "default-only.ucd-pipeline.ts": /* ts */`
        export default {
          _type: "pipeline-definition",
          id: "default-only",
          name: "Default Only",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelineFile(`${dir}/default-only.ucd-pipeline.ts`);

    expect(result.pipelines).toEqual([]);
    expect(result.exportNames).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "INVALID_EXPORT",
      scope: "import",
      filePath: `${dir}/default-only.ucd-pipeline.ts`,
    });
  });

  it("returns a bundle issue instead of throwing for syntax errors", async () => {
    const dir = await testdir({
      "broken.ucd-pipeline.ts": `export const broken = {`,
    });

    const result = await loadPipelineFile(`${dir}/broken.ucd-pipeline.ts`);

    expect(result.pipelines).toEqual([]);
    expect(result.exportNames).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "BUNDLE_TRANSFORM_FAILED",
      scope: "bundle",
      filePath: `${dir}/broken.ucd-pipeline.ts`,
    });
  });

  it("returns an import issue instead of throwing for runtime import failures", async () => {
    const dir = await testdir({
      "runtime-import.ucd-pipeline.ts": /* ts */`
        import { missing } from "@luxass/runtime-missing";

        export const runtimeImport = {
          _type: "pipeline-definition",
          id: "runtime-import",
          name: missing,
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelineFile({
      filePath: `${dir}/runtime-import.ucd-pipeline.ts`,
      bundleOptions: {
        external: ["@luxass/runtime-missing"],
      },
    });

    expect(result.pipelines).toEqual([]);
    expect(result.exportNames).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "IMPORT_FAILED",
      scope: "import",
      filePath: `${dir}/runtime-import.ucd-pipeline.ts`,
    });
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

    expect(result.files).toHaveLength(2);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.scope).toBe("bundle");
    expect(result.issues[0]?.code).toBe("BUNDLE_TRANSFORM_FAILED");
    expect(result.files.find((file) => file.filePath === `${dir}/bad.ucd-pipeline.ts`)?.issues).toHaveLength(1);
  });

  it("adds an INVALID_EXPORT issue when a file has no valid named pipeline exports", async () => {
    const dir = await testdir({
      "empty.ucd-pipeline.ts": /* ts */`
        export const notAPipeline = {
          id: "nope",
        };
      `,
    });

    const result = await loadPipelinesFromPaths([
      `${dir}/empty.ucd-pipeline.ts`,
    ]);

    expect(result.files).toHaveLength(1);
    expect(result.pipelines).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.files[0]?.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "INVALID_EXPORT",
      scope: "import",
      filePath: `${dir}/empty.ucd-pipeline.ts`,
    });
  });

  it("adds an INVALID_EXPORT issue when a file only uses a default export", async () => {
    const dir = await testdir({
      "default-only.ucd-pipeline.ts": /* ts */`
        export default {
          _type: "pipeline-definition",
          id: "default-only",
          name: "Default Only",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelinesFromPaths([
      `${dir}/default-only.ucd-pipeline.ts`,
    ]);

    expect(result.files).toHaveLength(1);
    expect(result.pipelines).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.files[0]?.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "INVALID_EXPORT",
      scope: "import",
      filePath: `${dir}/default-only.ucd-pipeline.ts`,
    });
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

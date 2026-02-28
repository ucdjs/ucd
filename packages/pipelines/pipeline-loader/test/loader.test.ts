import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { findPipelineFiles, loadPipelineFile, loadPipelinesFromPaths } from "../src/loader";

describe("loadPipelineFile", () => {
  it("should load a local pipeline file", async () => {
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
    expect(result.pipelines[0]?.name).toBe("Test Pipeline");
    expect(result.exportNames).toEqual(["testPipeline"]);
  });

  it("should handle relative imports in pipeline files", async () => {
    const dir = await testdir({
      "helper.ts": /* ts */`
        export const helper = () => "helper-output";
      `,
      "test.ucd-pipeline.ts": /* ts */`
        import { helper } from "./helper";

        export const testPipeline = {
          _type: "pipeline-definition",
          id: "test",
          name: "Test",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelineFile(`${dir}/test.ucd-pipeline.ts`);

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.id).toBe("test");
  });

  it("should return empty arrays for files without pipeline exports", async () => {
    const dir = await testdir({
      "empty.ts": /* ts */`
        export const config = { foo: "bar" };
      `,
    });

    const result = await loadPipelineFile(`${dir}/empty.ts`);

    expect(result.pipelines).toEqual([]);
    expect(result.exportNames).toEqual([]);
  });

  it("should ignore default exports", async () => {
    const dir = await testdir({
      "test.ucd-pipeline.ts": /* ts */`
        export default {
          _type: "pipeline-definition",
          id: "default",
          name: "Default",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };

        export const namedPipeline = {
          _type: "pipeline-definition",
          id: "named",
          name: "Named",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelineFile(`${dir}/test.ucd-pipeline.ts`);

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.id).toBe("named");
    expect(result.exportNames).toEqual(["namedPipeline"]);
  });

  it("should throw for non-existent files", async () => {
    await expect(loadPipelineFile("/nonexistent/file.ucd-pipeline.ts")).rejects.toThrow();
  });

  it("should throw for files with syntax errors", async () => {
    const dir = await testdir({
      "invalid.ucd-pipeline.ts": `export const a = ;`, // Syntax error
    });

    await expect(loadPipelineFile(`${dir}/invalid.ucd-pipeline.ts`)).rejects.toThrow();
  });
});

describe("findPipelineFiles", () => {
  it("should find all .ucd-pipeline.ts files in local directory", async () => {
    const dir = await testdir({
      pipelines: {
        "alpha.ucd-pipeline.ts": `export const a = 1;`,
        "beta.ucd-pipeline.ts": `export const b = 2;`,
        "gamma.txt": `not a pipeline`,
      },
      other: {
        "delta.ucd-pipeline.ts": `export const d = 4;`,
      },
      node_modules: {
        "ignored.ucd-pipeline.ts": `export const i = 9;`,
      },
    });

    const files = await findPipelineFiles({
      source: { type: "local", cwd: dir },
    });

    expect(files).toHaveLength(3);
    expect(files.map((f) => f.split("/").pop()).sort()).toEqual([
      "alpha.ucd-pipeline.ts",
      "beta.ucd-pipeline.ts",
      "delta.ucd-pipeline.ts",
    ]);
  });

  it("should support custom patterns", async () => {
    const dir = await testdir({
      pipelines: {
        "alpha.ucd-pipeline.ts": `export const a = 1;`,
        "beta.custom.ts": `export const b = 2;`,
      },
    });

    const files = await findPipelineFiles({
      source: { type: "local", cwd: dir },
      patterns: "**/*.custom.ts",
    });

    expect(files).toHaveLength(1);
    expect(files[0]).toContain("beta.custom.ts");
  });

  it("should use process.cwd() when no source specified", async () => {
    const files = await findPipelineFiles();
    // Should not throw, just return empty array or files from cwd
    expect(Array.isArray(files)).toBe(true);
  });
});

describe("loadPipelinesFromPaths", () => {
  it("should load multiple pipeline files", async () => {
    const dir = await testdir({
      "alpha.ucd-pipeline.ts": `
        export const alpha = {
          _type: "pipeline-definition",
          id: "alpha",
          name: "Alpha",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
      "beta.ucd-pipeline.ts": `
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

    expect(result.errors).toEqual([]);
    expect(result.files).toHaveLength(2);
    expect(result.pipelines.map((p) => p.id).sort()).toEqual(["alpha", "beta"]);
  });

  it("should collect errors for failed files without throwing", async () => {
    const dir = await testdir({
      "valid.ucd-pipeline.ts": `
        export const valid = {
          _type: "pipeline-definition",
          id: "valid",
          name: "Valid",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const result = await loadPipelinesFromPaths([
      `${dir}/valid.ucd-pipeline.ts`,
      `${dir}/nonexistent.ucd-pipeline.ts`,
    ]);

    expect(result.files).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.filePath).toContain("nonexistent");
    expect(result.pipelines.map((p) => p.id)).toEqual(["valid"]);
  });

  it("should throw when throwOnError is true", async () => {
    await expect(
      loadPipelinesFromPaths(["/nonexistent/file.ts"], { throwOnError: true }),
    ).rejects.toThrow();
  });
});

describe("unified API - URL parsing", () => {
  it("should parse github:// URLs correctly", async () => {
    const testUrl = "github://ucdjs/demo?ref=main&path=pipelines/test.ucd-pipeline.ts";

    // Should fail to fetch, but parsing should work
    await expect(loadPipelineFile(testUrl)).rejects.toThrow();
  });

  it("should parse gitlab:// URLs correctly", async () => {
    const testUrl = "gitlab://mygroup/demo?ref=main&path=pipelines/test.ucd-pipeline.ts";

    // Should fail to fetch, but parsing should work
    await expect(loadPipelineFile(testUrl)).rejects.toThrow();
  });
});

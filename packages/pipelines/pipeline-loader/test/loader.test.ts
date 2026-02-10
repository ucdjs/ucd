import path from "node:path";
import { createPipelineModuleSource } from "#test-utils/pipelines";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { findPipelineFiles, loadPipelineFile, loadPipelinesFromPaths } from "../src";

describe("findPipelineFiles", () => {
  it("should find pipeline files and ignore node_modules and dist", async () => {
    const root = await testdir({
      pipelines: {
        "alpha.ucd-pipeline.ts": createPipelineModuleSource({ named: ["alpha"] }),
        "nested": {
          "beta.ucd-pipeline.ts": createPipelineModuleSource({ named: ["beta"] }),
        },
      },
      node_modules: {
        "ignored.ucd-pipeline.ts": createPipelineModuleSource({ named: ["ignored"] }),
      },
      dist: {
        "built.ucd-pipeline.ts": createPipelineModuleSource({ named: ["built"] }),
      },
    });

    const files = await findPipelineFiles({
      cwd: root,
    });
    const expected = [
      path.join(root, "pipelines", "alpha.ucd-pipeline.ts"),
      path.join(root, "pipelines", "nested", "beta.ucd-pipeline.ts"),
    ];

    expect(files.sort()).toEqual(expected.sort());
    expect(files.every((file: string) => path.isAbsolute(file))).toBe(true);
  });

  it("should support custom patterns with a cwd", async () => {
    const root = await testdir({
      pipelines: {
        "gamma.ucd-pipeline.ts": createPipelineModuleSource({ named: ["gamma"] }),
        "notes.txt": "not a pipeline",
      },
      other: {
        "delta.ucd-pipeline.ts": createPipelineModuleSource({ named: ["delta"] }),
      },
    });

    const cwd = path.join(root, "pipelines");
    const files = await findPipelineFiles({
      cwd,
    });

    expect(files).toEqual([path.join(cwd, "gamma.ucd-pipeline.ts")]);
  });
});

describe("loadPipelineFile", () => {
  it("should load pipeline definitions and export names", async () => {
    const root = await testdir({
      "demo.ucd-pipeline.ts": createPipelineModuleSource({
        named: ["alpha"],
        extraExports: "export const config = { name: \"pipeline\" };",
      }),
    });
    const filePath = path.join(root, "demo.ucd-pipeline.ts");

    const result = await loadPipelineFile(filePath);

    expect(result.filePath).toBe(filePath);
    expect(result.exportNames).toEqual(["alpha"]);
    expect(result.exportNames).toHaveLength(1);
    expect(result.pipelines.map((pipeline) => pipeline.id)).toEqual(["alpha"]);
  });

  it("should return empty arrays when no pipelines are exported", async () => {
    const root = await testdir({
      "empty.ucd-pipeline.ts": "export const config = { ok: true };",
    });
    const filePath = path.join(root, "empty.ucd-pipeline.ts");

    const result = await loadPipelineFile(filePath);

    expect(result.pipelines).toEqual([]);
    expect(result.exportNames).toEqual([]);
  });
});

describe("loadPipelinesFromPaths", () => {
  it("should merge pipelines and file metadata", async () => {
    const root = await testdir({
      "alpha.ucd-pipeline.ts": createPipelineModuleSource({ named: ["alpha"] }),
      "beta.ucd-pipeline.ts": createPipelineModuleSource({ named: ["beta"] }),
    });

    const alphaPath = path.join(root, "alpha.ucd-pipeline.ts");
    const betaPath = path.join(root, "beta.ucd-pipeline.ts");

    const result = await loadPipelinesFromPaths([alphaPath, betaPath]);

    expect(result.errors).toEqual([]);
    expect(result.files.map((file) => file.filePath)).toEqual([alphaPath, betaPath]);
    expect(result.pipelines.map((pipeline) => pipeline.id).sort()).toEqual(["alpha", "beta"]);
  });

  it("should collect errors when files fail to load", async () => {
    const root = await testdir({
      "alpha.ucd-pipeline.ts": createPipelineModuleSource({ named: ["alpha"] }),
    });

    const alphaPath = path.join(root, "alpha.ucd-pipeline.ts");
    const missingPath = path.join(root, "missing.ucd-pipeline.ts");

    const result = await loadPipelinesFromPaths([alphaPath, missingPath]);

    expect(result.files).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.filePath).toBe(missingPath);
    expect(result.errors[0]?.error).toBeInstanceOf(Error);
    expect(result.pipelines.map((pipeline) => pipeline.id)).toEqual(["alpha"]);
  });

  it("should throw when throwOnError is enabled", async () => {
    const root = await testdir({
      "alpha.ucd-pipeline.ts": createPipelineModuleSource({ named: ["alpha"] }),
    });

    const missingPath = path.join(root, "missing.ucd-pipeline.ts");

    try {
      await loadPipelinesFromPaths([missingPath], { throwOnError: true });
      throw new Error("Expected loadPipelinesFromPaths to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(`Failed to load pipeline file: ${missingPath}`);
      expect((error as Error).cause).toBeInstanceOf(Error);
    }
  });
});

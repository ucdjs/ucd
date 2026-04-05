import type { PipelineSource } from "#server/app";
import { discoverSourceFiles, resolveSourceFiles, sourceLabel } from "#server/lib/resolve";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";

const tsconfigTestdirFile = {
  "tsconfig.json": JSON.stringify({
    compilerOptions: {
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "Bundler",
      lib: ["ESNext"],
      paths: {
        "@ucdjs/pipeline-loader": ["../../packages/pipelines/pipeline-loader/src/index.ts"],
        "@ucdjs/pipeline-core": ["../../packages/pipelines/pipeline-core/src/index.ts"],
      },
    },
  }),
};

function pipelineFile(id: string, name: string) {
  return /* ts */ `
    import { definePipeline } from "@ucdjs/pipeline-core";

    export const ${id}Pipeline = definePipeline({
      id: "${id}",
      name: "${name}",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });
  `;
}

describe("sourceLabel", () => {
  it.each([
    [{ kind: "local", id: "my-source", path: "/some/path" } satisfies PipelineSource, "local"],
    [{ kind: "remote", provider: "github", owner: "ucdjs", repo: "ucd-pipelines", ref: "main", id: "remote" } satisfies PipelineSource, "ucdjs/ucd-pipelines"],
    [{ kind: "remote", provider: "gitlab", owner: "alice", repo: "project-x", id: "remote2" } satisfies PipelineSource, "alice/project-x"],
  ])("returns correct label for %o", (source, expected) => {
    expect(sourceLabel(source)).toBe(expected);
  });
});

describe("discoverSourceFiles", () => {
  it("discovers pipeline files in a local directory", async () => {
    const dir = await testdir({
      "alpha.ucd-pipeline.ts": "",
      "beta.ucd-pipeline.ts": "",
    });

    const result = await discoverSourceFiles({
      kind: "local",
      id: "test",
      path: dir,
    });

    expect(result.issues).toEqual([]);
    expect(result.files).toHaveLength(2);

    const relativePaths = result.files.map((f) => f.relativePath).sort();
    expect(relativePaths).toEqual(["alpha.ucd-pipeline.ts", "beta.ucd-pipeline.ts"]);
  });

  it("discovers nested pipeline files recursively", async () => {
    const dir = await testdir({
      "top.ucd-pipeline.ts": "",
      "nested": {
        "deep.ucd-pipeline.ts": "",
      },
    });

    const result = await discoverSourceFiles({
      kind: "local",
      id: "test",
      path: dir,
    });

    expect(result.issues).toEqual([]);
    expect(result.files).toHaveLength(2);

    const relativePaths = result.files.map((f) => f.relativePath).sort();
    expect(relativePaths).toEqual(["nested/deep.ucd-pipeline.ts", "top.ucd-pipeline.ts"]);
  });

  it("derives id and label from relative paths", async () => {
    const dir = await testdir({
      group: {
        "example.ucd-pipeline.ts": "",
      },
    });

    const result = await discoverSourceFiles({
      kind: "local",
      id: "test",
      path: dir,
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatchObject({
      id: "group~example",
      label: "group/example",
      relativePath: "group/example.ucd-pipeline.ts",
    });
  });

  it("discovers a single file when path points directly to it", async () => {
    const dir = await testdir({
      "single.ucd-pipeline.ts": "",
    });

    const result = await discoverSourceFiles({
      kind: "local",
      id: "test",
      path: `${dir}/single.ucd-pipeline.ts`,
    });

    expect(result.issues).toEqual([]);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatchObject({
      id: "single",
      label: "single",
      relativePath: "single.ucd-pipeline.ts",
    });
  });

  it("returns issues when the path does not exist", async () => {
    const dir = await testdir();

    const result = await discoverSourceFiles({
      kind: "local",
      id: "broken",
      path: `${dir}/nonexistent`,
    });

    expect(result.files).toEqual([]);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("returns empty files for a directory with no pipeline files", async () => {
    const dir = await testdir({
      "readme.md": "# Not a pipeline",
    });

    const result = await discoverSourceFiles({
      kind: "local",
      id: "test",
      path: dir,
    });

    expect(result.files).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  it("only discovers .ucd-pipeline.ts files, ignores other ts files", async () => {
    const dir = await testdir({
      "valid.ucd-pipeline.ts": "",
      "helper.ts": "",
      "config.json": "{}",
    });

    const result = await discoverSourceFiles({
      kind: "local",
      id: "test",
      path: dir,
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0]!.relativePath).toBe("valid.ucd-pipeline.ts");
  });

  it("includes absolute filePath for each discovered file", async () => {
    const dir = await testdir({
      "example.ucd-pipeline.ts": "",
    });

    const result = await discoverSourceFiles({
      kind: "local",
      id: "test",
      path: dir,
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0]!.filePath).toContain(dir);
    expect(result.files[0]!.filePath).toContain("example.ucd-pipeline.ts");
  });
});

describe("resolveSourceFiles", () => {
  it("discovers pipeline files in a local directory", async () => {
    const dir = await testdir({
      ...tsconfigTestdirFile,
      "alpha.ucd-pipeline.ts": pipelineFile("alpha", "Alpha"),
    });

    const result = await resolveSourceFiles({
      kind: "local",
      id: "test",
      path: dir,
    });

    expect(result.issues).toEqual([]);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatchObject({
      id: "alpha",
      label: "alpha",
      relativePath: "alpha.ucd-pipeline.ts",
    });
    expect(result.files[0]!.pipelines).toHaveLength(1);
    expect(result.files[0]!.pipelines[0]!.id).toBe("alpha");
  });

  it("discovers nested pipeline files recursively", async () => {
    const dir = await testdir({
      ...tsconfigTestdirFile,
      "top.ucd-pipeline.ts": pipelineFile("top", "Top"),
      "nested": {
        "deep.ucd-pipeline.ts": pipelineFile("deep", "Deep"),
      },
    });

    const result = await resolveSourceFiles({
      kind: "local",
      id: "test",
      path: dir,
    });

    expect(result.issues).toEqual([]);
    expect(result.files).toHaveLength(2);

    const ids = result.files.map((f) => f.id).sort();
    expect(ids).toEqual(["nested~deep", "top"]);
  });

  it("discovers a single file when path points directly to it", async () => {
    const dir = await testdir({
      ...tsconfigTestdirFile,
      "single.ucd-pipeline.ts": pipelineFile("single", "Single"),
    });

    const result = await resolveSourceFiles({
      kind: "local",
      id: "test",
      path: `${dir}/single.ucd-pipeline.ts`,
    });

    expect(result.issues).toEqual([]);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatchObject({
      id: "single",
      relativePath: "single.ucd-pipeline.ts",
    });
  });

  it("returns issues for a nonexistent path", async () => {
    const dir = await testdir();

    const result = await resolveSourceFiles({
      kind: "local",
      id: "missing",
      path: `${dir}/nonexistent`,
    });

    expect(result.files).toEqual([]);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("returns empty files for a directory with no pipeline files", async () => {
    const dir = await testdir({
      "readme.md": "# Not a pipeline",
      "config.json": "{}",
    });

    const result = await resolveSourceFiles({
      kind: "local",
      id: "test",
      path: dir,
    });

    expect(result.files).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  it("ignores non-pipeline files in a mixed directory", async () => {
    const dir = await testdir({
      ...tsconfigTestdirFile,
      "valid.ucd-pipeline.ts": pipelineFile("valid", "Valid"),
      "readme.md": "# Not a pipeline",
      "helper.ts": "export const x = 1;",
    });

    const result = await resolveSourceFiles({
      kind: "local",
      id: "test",
      path: dir,
    });

    expect(result.issues).toEqual([]);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]!.id).toBe("valid");
  });

  it("reports loading issues for a malformed pipeline file without throwing", async () => {
    const dir = await testdir({
      ...tsconfigTestdirFile,
      "good.ucd-pipeline.ts": pipelineFile("good", "Good"),
      "bad.ucd-pipeline.ts": "export const broken = {",
    });

    const result = await resolveSourceFiles({
      kind: "local",
      id: "test",
      path: dir,
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0]!.id).toBe("good");
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

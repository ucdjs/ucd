import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { findPipelineFiles, loadPipelineFile, loadPipelinesFromPaths } from "../src/loader";

vi.mock("@ucdjs-internal/shared/config", async () => {
  const actual = await vi.importActual("@ucdjs-internal/shared/config");
  return {
    ...actual,
    getBaseRepoCacheDir: vi.fn(),
  };
});

const getBaseRepoCacheDirMock = vi.mocked(await import("@ucdjs-internal/shared/config")).getBaseRepoCacheDir;

describe("loadPipelineFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

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
      "invalid.ts": `
        export const broken = {
          // Missing closing brace
      `,
    });

    await expect(loadPipelineFile(`${dir}/invalid.ts`)).rejects.toThrow();
  });

  it("should return filePath as absolute path and sourceFilePath as undefined for local sources", async () => {
    const dir = await testdir({
      "local.ucd-pipeline.ts": /* ts */`
        export const localPipeline = {
          _type: "pipeline-definition",
          id: "local",
          name: "Local Pipeline",
          versions: ["16.0.0"],
          inputs: [],
          routes: [],
        };
      `,
    });

    const filePath = `${dir}/local.ucd-pipeline.ts`;
    const result = await loadPipelineFile(filePath);

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.id).toBe("local");

    expect(result.filePath).toBe(filePath);
    expect(result.sourceFilePath).toBeUndefined();
  });

  describe("remote sources via github:// URLs", () => {
    it("should load a cached remote pipeline file and return filePath as absolute local path with sourceFilePath as URL", async () => {
      const tmpBaseDir = await testdir({
        "github/owner/repo/main/src/remote.ucd-pipeline.ts": /* ts */`
          export const remotePipeline = {
            _type: "pipeline-definition",
            id: "remote",
            name: "Remote Pipeline",
            versions: ["16.0.0"],
            inputs: [],
            routes: [],
          };
        `,
        "github/owner/repo/main/.ucd-cache.json": JSON.stringify({
          source: "github",
          owner: "owner",
          repo: "repo",
          ref: "main",
          commitSha: "abc123",
          syncedAt: new Date().toISOString(),
        }),
      });

      getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

      const url = "github://owner/repo?ref=main&path=src/remote.ucd-pipeline.ts";
      const result = await loadPipelineFile(url);

      expect(result.pipelines).toHaveLength(1);
      expect(result.pipelines[0]?.id).toBe("remote");

      expect(result.filePath).toBe(`${tmpBaseDir}/github/owner/repo/main/src/remote.ucd-pipeline.ts`);
      expect(result.sourceFilePath).toBe(url);
    });

    it("should throw CacheMissError when remote source is not cached", async () => {
      const tmpBaseDir = await testdir();
      getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

      const url = "github://owner/repo?ref=main&path=src/missing.ucd-pipeline.ts";

      await expect(loadPipelineFile(url)).rejects.toThrow("Cache miss");
    });
  });
});

describe("findPipelineFiles", () => {
  it("should find pipeline files with default pattern", async () => {
    const dir = await testdir({
      "alpha.ucd-pipeline.ts": "",
      "beta.ucd-pipeline.ts": "",
      "gamma.ts": "", // Should not match
    });

    const files = await findPipelineFiles({
      source: { type: "local", cwd: dir },
    });

    const fileNames = files.map((f) => path.basename(f)).sort();

    expect(files).toHaveLength(2);
    expect(fileNames).toEqual(["alpha.ucd-pipeline.ts", "beta.ucd-pipeline.ts"]);
  });

  it("should find pipeline files with custom pattern", async () => {
    const dir = await testdir({
      "alpha.ucd-pipeline.ts": "",
      "beta.custom.ts": "",
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

  describe("remote sources", () => {
    it("should return absolute paths for cached remote sources", async () => {
      const tmpBaseDir = await testdir({
        "github/owner/repo/main/src/test.ucd-pipeline.ts": "",
        "github/owner/repo/main/.ucd-cache.json": JSON.stringify({
          source: "github",
          owner: "owner",
          repo: "repo",
          ref: "main",
          commitSha: "abc123",
          syncedAt: new Date().toISOString(),
        }),
      });

      getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

      const files = await findPipelineFiles({
        source: {
          type: "github",
          owner: "owner",
          repo: "repo",
          ref: "main",
        },
      });

      expect(files).toHaveLength(1);
      expect(files[0]).toBe(`${tmpBaseDir}/github/owner/repo/main/src/test.ucd-pipeline.ts`);
    });

    it("should throw CacheMissError for uncached remote sources", async () => {
      const tmpBaseDir = await testdir();
      getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

      await expect(
        findPipelineFiles({
          source: {
            type: "github",
            owner: "owner",
            repo: "repo",
            ref: "main",
          },
        }),
      ).rejects.toThrow("Cache miss");
    });
  });
});

describe("loadPipelinesFromPaths", () => {
  it("should load multiple pipeline files", async () => {
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

    expect(result.errors).toEqual([]);
    expect(result.files).toHaveLength(2);
    expect(result.pipelines.map((p) => p.id).sort()).toEqual(["alpha", "beta"]);
  });

  it("should collect errors for failed files without throwing", async () => {
    const dir = await testdir({
      "valid.ucd-pipeline.ts": /* ts */`
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

  describe("remote sources via github:// URLs", () => {
    it("should load remote files and return filePath as absolute local path with sourceFilePath as URL", async () => {
      const tmpBaseDir = await testdir({
        "github/owner/repo/main/src/remote.ucd-pipeline.ts": /* ts */`
          export const remotePipeline = {
            _type: "pipeline-definition",
            id: "remote",
            name: "Remote",
            versions: ["16.0.0"],
            inputs: [],
            routes: [],
          };
        `,
        "github/owner/repo/main/.ucd-cache.json": JSON.stringify({
          source: "github",
          owner: "owner",
          repo: "repo",
          ref: "main",
          commitSha: "abc123",
          syncedAt: new Date().toISOString(),
        }),
      });

      getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

      const url = "github://owner/repo?ref=main&path=src/remote.ucd-pipeline.ts";
      const result = await loadPipelinesFromPaths([url]);

      expect(result.errors).toEqual([]);
      expect(result.files).toHaveLength(1);
      expect(result.pipelines).toHaveLength(1);

      expect(result.files[0]?.filePath).toBe(`${tmpBaseDir}/github/owner/repo/main/src/remote.ucd-pipeline.ts`);
      expect(result.files[0]?.sourceFilePath).toBe(url);
    });

    it("should handle mix of local and remote sources", async () => {
      const localDir = await testdir({
        "local.ucd-pipeline.ts": /* ts */`
          export const localPipeline = {
            _type: "pipeline-definition",
            id: "local",
            name: "Local",
            versions: ["16.0.0"],
            inputs: [],
            routes: [],
          };
        `,
      });

      const tmpBaseDir = await testdir({
        "github/owner/repo/main/src/remote.ucd-pipeline.ts": /* ts */`
          export const remotePipeline = {
            _type: "pipeline-definition",
            id: "remote",
            name: "Remote",
            versions: ["16.0.0"],
            inputs: [],
            routes: [],
          };
        `,
        "github/owner/repo/main/.ucd-cache.json": JSON.stringify({
          source: "github",
          owner: "owner",
          repo: "repo",
          ref: "main",
          commitSha: "abc123",
          syncedAt: new Date().toISOString(),
        }),
      });

      getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

      const localPath = `${localDir}/local.ucd-pipeline.ts`;
      const remoteUrl = "github://owner/repo?ref=main&path=src/remote.ucd-pipeline.ts";

      const result = await loadPipelinesFromPaths([localPath, remoteUrl]);

      expect(result.errors).toEqual([]);
      expect(result.files).toHaveLength(2);
      expect(result.pipelines.map((p) => p.id).sort()).toEqual(["local", "remote"]);

      const localFile = result.files.find((f) => f.filePath === localPath);
      expect(localFile?.filePath).toBe(localPath);
      expect(localFile?.sourceFilePath).toBeUndefined();

      const remoteFile = result.files.find((f) => f.sourceFilePath === remoteUrl);
      expect(remoteFile?.filePath).toBe(`${tmpBaseDir}/github/owner/repo/main/src/remote.ucd-pipeline.ts`);
      expect(remoteFile?.sourceFilePath).toBe(remoteUrl);
    });

    it("should return errors for uncached remote sources", async () => {
      const tmpBaseDir = await testdir();
      getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

      const url = "github://owner/repo?ref=main&path=src/missing.ucd-pipeline.ts";
      const result = await loadPipelinesFromPaths([url]);

      expect(result.files).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.filePath).toBe(url);
    });
  });
});

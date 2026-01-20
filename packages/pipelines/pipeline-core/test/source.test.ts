import type {
  InferSourceId,
  InferSourceIds,
  SourceBackend,
} from "../src/source";
import type { FileContext } from "../src/types";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  definePipelineSource,
  resolveMultipleSourceFiles,
  resolveSourceFiles,
} from "../src/source";

function createMockBackend(files: FileContext[]): SourceBackend {
  return {
    listFiles: vi.fn().mockResolvedValue(files),
    readFile: vi.fn().mockResolvedValue("file content"),
  };
}

function createFileContext(overrides: Partial<FileContext> = {}): FileContext {
  return {
    version: "16.0.0",
    dir: "ucd",
    path: "ucd/LineBreak.txt",
    name: "LineBreak.txt",
    ext: ".txt",
    ...overrides,
  };
}

describe("definePipelineSource", () => {
  describe("basic functionality", () => {
    it("should define a source with id and backend", () => {
      const backend = createMockBackend([]);
      const source = definePipelineSource({
        id: "unicode",
        backend,
      });

      expect(source.id).toBe("unicode");
      expect(source.backend).toBe(backend);
    });

    it("should define a source with includes filter", () => {
      const backend = createMockBackend([]);
      const includes = vi.fn().mockReturnValue(true);

      const source = definePipelineSource({
        id: "filtered",
        backend,
        includes,
      });

      expect(source.includes).toBe(includes);
    });

    it("should define a source with excludes filter", () => {
      const backend = createMockBackend([]);
      const excludes = vi.fn().mockReturnValue(false);

      const source = definePipelineSource({
        id: "filtered",
        backend,
        excludes,
      });

      expect(source.excludes).toBe(excludes);
    });

    it("should define a source with both includes and excludes", () => {
      const backend = createMockBackend([]);
      const includes = vi.fn().mockReturnValue(true);
      const excludes = vi.fn().mockReturnValue(false);

      const source = definePipelineSource({
        id: "dual-filtered",
        backend,
        includes,
        excludes,
      });

      expect(source.includes).toBe(includes);
      expect(source.excludes).toBe(excludes);
    });
  });
});

describe("resolveSourceFiles", () => {
  it("should resolve all files from backend", async () => {
    const files = [
      createFileContext({ path: "ucd/LineBreak.txt", name: "LineBreak.txt" }),
      createFileContext({ path: "ucd/Scripts.txt", name: "Scripts.txt" }),
    ];
    const backend = createMockBackend(files);
    const source = definePipelineSource({ id: "test", backend });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(2);
    expect(backend.listFiles).toHaveBeenCalledWith("16.0.0");
  });

  it("should add source id to each file", async () => {
    const files = [createFileContext()];
    const backend = createMockBackend(files);
    const source = definePipelineSource({ id: "my-source", backend });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result[0]?.source).toEqual({ id: "my-source" });
  });

  it("should filter files using includes", async () => {
    const files = [
      createFileContext({ path: "ucd/LineBreak.txt", name: "LineBreak.txt" }),
      createFileContext({ path: "ucd/Scripts.txt", name: "Scripts.txt" }),
      createFileContext({ path: "emoji/data.txt", name: "data.txt", dir: "emoji" }),
    ];
    const backend = createMockBackend(files);
    const includes = (ctx: { file: FileContext }) => ctx.file.dir === "ucd";

    const source = definePipelineSource({ id: "test", backend, includes });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(2);
    expect(result.every((f) => f.dir === "ucd")).toBe(true);
  });

  it("should filter files using excludes", async () => {
    const files = [
      createFileContext({ path: "ucd/LineBreak.txt", name: "LineBreak.txt" }),
      createFileContext({ path: "ucd/ReadMe.txt", name: "ReadMe.txt" }),
      createFileContext({ path: "ucd/Scripts.txt", name: "Scripts.txt" }),
    ];
    const backend = createMockBackend(files);
    const excludes = (ctx: { file: FileContext }) => ctx.file.name === "ReadMe.txt";

    const source = definePipelineSource({ id: "test", backend, excludes });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(2);
    expect(result.some((f) => f.name === "ReadMe.txt")).toBe(false);
  });

  it("should apply both includes and excludes", async () => {
    const files = [
      createFileContext({ path: "ucd/LineBreak.txt", name: "LineBreak.txt" }),
      createFileContext({ path: "ucd/ReadMe.txt", name: "ReadMe.txt" }),
      createFileContext({ path: "emoji/data.txt", name: "data.txt", dir: "emoji" }),
    ];
    const backend = createMockBackend(files);
    const includes = (ctx: { file: FileContext }) => ctx.file.dir === "ucd";
    const excludes = (ctx: { file: FileContext }) => ctx.file.name === "ReadMe.txt";

    const source = definePipelineSource({ id: "test", backend, includes, excludes });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("LineBreak.txt");
  });

  it("should return empty array when no files match", async () => {
    const files = [createFileContext({ dir: "emoji" })];
    const backend = createMockBackend(files);
    const includes = (ctx: { file: FileContext }) => ctx.file.dir === "ucd";

    const source = definePipelineSource({ id: "test", backend, includes });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(0);
  });

  it("should return empty array when backend returns empty", async () => {
    const backend = createMockBackend([]);
    const source = definePipelineSource({ id: "test", backend });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(0);
  });

  it("should preserve all file properties", async () => {
    const file = createFileContext({
      version: "16.0.0",
      dir: "ucd",
      path: "ucd/LineBreak.txt",
      name: "LineBreak.txt",
      ext: ".txt",
    });
    const backend = createMockBackend([file]);
    const source = definePipelineSource({ id: "test", backend });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result[0]).toBeDefined();
    expect(result[0]).toMatchObject({
      version: "16.0.0",
      dir: "ucd",
      path: "ucd/LineBreak.txt",
      name: "LineBreak.txt",
      ext: ".txt",
      source: { id: "test" },
    });
  });
});

describe("resolveMultipleSourceFiles", () => {
  it("should resolve files from multiple sources", async () => {
    const source1Files = [createFileContext({ path: "ucd/LineBreak.txt" })];
    const source2Files = [createFileContext({ path: "emoji/data.txt", dir: "emoji" })];

    const source1 = definePipelineSource({
      id: "source1",
      backend: createMockBackend(source1Files),
    });
    const source2 = definePipelineSource({
      id: "source2",
      backend: createMockBackend(source2Files),
    });

    const result = await resolveMultipleSourceFiles([source1, source2], "16.0.0");

    expect(result).toHaveLength(2);
  });

  it("should deduplicate files by path (last source wins)", async () => {
    const source1Files = [
      createFileContext({ path: "ucd/LineBreak.txt", name: "LineBreak.txt" }),
    ];
    const source2Files = [
      createFileContext({ path: "ucd/LineBreak.txt", name: "LineBreak.txt" }),
    ];

    const source1 = definePipelineSource({
      id: "source1",
      backend: createMockBackend(source1Files),
    });
    const source2 = definePipelineSource({
      id: "source2",
      backend: createMockBackend(source2Files),
    });

    const result = await resolveMultipleSourceFiles([source1, source2], "16.0.0");

    expect(result).toHaveLength(1);
    expect(result[0]?.source.id).toBe("source2");
  });

  it("should return empty array for empty sources array", async () => {
    const result = await resolveMultipleSourceFiles([], "16.0.0");

    expect(result).toHaveLength(0);
  });

  it("should handle sources with no files", async () => {
    const source1 = definePipelineSource({
      id: "empty1",
      backend: createMockBackend([]),
    });
    const source2 = definePipelineSource({
      id: "empty2",
      backend: createMockBackend([]),
    });

    const result = await resolveMultipleSourceFiles([source1, source2], "16.0.0");

    expect(result).toHaveLength(0);
  });

  it("should apply filters from each source independently", async () => {
    const source1Files = [
      createFileContext({ path: "ucd/LineBreak.txt", dir: "ucd" }),
      createFileContext({ path: "ucd/ReadMe.txt", dir: "ucd", name: "ReadMe.txt" }),
    ];
    const source2Files = [
      createFileContext({ path: "emoji/data.txt", dir: "emoji" }),
    ];

    const source1 = definePipelineSource({
      id: "source1",
      backend: createMockBackend(source1Files),
      excludes: (ctx) => ctx.file.name === "ReadMe.txt",
    });
    const source2 = definePipelineSource({
      id: "source2",
      backend: createMockBackend(source2Files),
    });

    const result = await resolveMultipleSourceFiles([source1, source2], "16.0.0");

    expect(result).toHaveLength(2);
    expect(result.some((f) => f.name === "ReadMe.txt")).toBe(false);
  });
});

describe("type inference", () => {
  describe("inferSourceId", () => {
    it("should infer source id type", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const source = definePipelineSource({
        id: "my-source",
        backend: createMockBackend([]),
      });

      type SourceId = InferSourceId<typeof source>;
      expectTypeOf<SourceId>().toEqualTypeOf<"my-source">();
    });
  });

  describe("inferSourceIds", () => {
    it("should infer multiple source ids", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const sources = [
        definePipelineSource({ id: "source1", backend: createMockBackend([]) }),
        definePipelineSource({ id: "source2", backend: createMockBackend([]) }),
      ] as const;

      type SourceIds = InferSourceIds<typeof sources>;
      expectTypeOf<SourceIds>().toEqualTypeOf<"source1" | "source2">();
    });
  });
});

describe("sourceFileContext", () => {
  it("should extend FileContext with source info", async () => {
    const files = [createFileContext()];
    const backend = createMockBackend(files);
    const source = definePipelineSource({ id: "test-source", backend });

    const result = await resolveSourceFiles(source, "16.0.0");
    expect(result[0]).toBeDefined();
    const file = result[0]!;

    expect(file.source).toBeDefined();
    expect(file.source.id).toBe("test-source");
    expect(file.version).toBe("16.0.0");
    expect(file.dir).toBe("ucd");
  });
});

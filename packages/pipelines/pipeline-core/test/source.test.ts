import type {
  InferSourceId,
  InferSourceIds,
  PipelineSourceDefinition,
  SourceFileContext,
} from "../src/source";
import type { FileContext, PipelineFilter } from "../src/types";
import { assert, describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  definePipelineSource,
  resolveMultipleSourceFiles,
  resolveSourceFiles,
} from "../src/source";
import { createFile, createMockBackend } from "./_test-utils";

describe("definePipelineSource", () => {
  it("should return source definition with correct types", () => {
    const backend = createMockBackend([]);
    const source = definePipelineSource({
      id: "unicode",
      backend,
    });

    expect(source.id).toBe("unicode");
    expect(source.backend).toBe(backend);
    expect(source.includes).toBeUndefined();
    expect(source.excludes).toBeUndefined();

    expectTypeOf(source).toEqualTypeOf<PipelineSourceDefinition<"unicode">>();
    expectTypeOf(source.id).toEqualTypeOf<"unicode">();
  });

  it("should accept includes filter", () => {
    const backend = createMockBackend([]);
    const includes = vi.fn().mockReturnValue(true);

    const source = definePipelineSource({
      id: "filtered",
      backend,
      includes,
    });

    expect(source.includes).toBe(includes);
    expectTypeOf(source.includes).toEqualTypeOf<PipelineFilter | undefined>();
  });

  it("should accept excludes filter", () => {
    const backend = createMockBackend([]);
    const excludes = vi.fn().mockReturnValue(false);

    const source = definePipelineSource({
      id: "filtered",
      backend,
      excludes,
    });

    expect(source.excludes).toBe(excludes);
    expectTypeOf(source.excludes).toEqualTypeOf<PipelineFilter | undefined>();
  });

  it("should accept both includes and excludes filters", () => {
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

  it("should infer literal string type for id", () => {
    const source = definePipelineSource({
      id: "my-literal-id",
      backend: createMockBackend([]),
    });

    expectTypeOf(source.id).toEqualTypeOf<"my-literal-id">();
    expectTypeOf(source.id).not.toEqualTypeOf<string>();
  });
});

describe("resolveSourceFiles", () => {
  it("should resolve all files from backend", async () => {
    const files = [
      createFile({ path: "ucd/LineBreak.txt", name: "LineBreak.txt" }),
      createFile({ path: "ucd/Scripts.txt", name: "Scripts.txt" }),
    ];
    const backend = createMockBackend(files);
    const source = definePipelineSource({ id: "test", backend });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(2);
    expect(backend.listFiles).toHaveBeenCalledWith("16.0.0");
    expect(backend.listFiles).toHaveBeenCalledTimes(1);

    expectTypeOf(result).toEqualTypeOf<SourceFileContext[]>();
  });

  it("should add source id to each file", async () => {
    const files = [createFile()];
    const backend = createMockBackend(files);
    const source = definePipelineSource({ id: "my-source", backend });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result[0]?.source).toEqual({ id: "my-source" });
    assert(result[0]?.source);
    expectTypeOf(result[0]?.source.id).toEqualTypeOf<string>();
  });

  it("should filter files using includes", async () => {
    const files = [
      createFile({ path: "ucd/LineBreak.txt", name: "LineBreak.txt", dir: "ucd" }),
      createFile({ path: "ucd/Scripts.txt", name: "Scripts.txt", dir: "ucd" }),
      createFile({ path: "emoji/data.txt", name: "data.txt", dir: "emoji" }),
    ];
    const backend = createMockBackend(files);
    const includes = (ctx: any) => ctx.file.dir === "ucd";

    const source = definePipelineSource({ id: "test", backend, includes });
    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(2);
    expect(result.every((f) => f.dir === "ucd")).toBe(true);
    expect(result.map((f) => f.name)).toEqual(["LineBreak.txt", "Scripts.txt"]);
  });

  it("should filter files using excludes", async () => {
    const files = [
      createFile({ path: "ucd/LineBreak.txt", name: "LineBreak.txt" }),
      createFile({ path: "ucd/ReadMe.txt", name: "ReadMe.txt" }),
      createFile({ path: "ucd/Scripts.txt", name: "Scripts.txt" }),
    ];
    const backend = createMockBackend(files);
    const excludes = (ctx: any) => ctx.file.name === "ReadMe.txt";

    const source = definePipelineSource({ id: "test", backend, excludes });
    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(2);
    expect(result.some((f) => f.name === "ReadMe.txt")).toBe(false);
    expect(result.map((f) => f.name)).toEqual(["LineBreak.txt", "Scripts.txt"]);
  });

  it("should apply both includes and excludes filters", async () => {
    const files = [
      createFile({ path: "ucd/LineBreak.txt", name: "LineBreak.txt", dir: "ucd" }),
      createFile({ path: "ucd/ReadMe.txt", name: "ReadMe.txt", dir: "ucd" }),
      createFile({ path: "emoji/data.txt", name: "data.txt", dir: "emoji" }),
    ];
    const backend = createMockBackend(files);
    const includes = (ctx: any) => ctx.file.dir === "ucd";
    const excludes = (ctx: any) => ctx.file.name === "ReadMe.txt";

    const source = definePipelineSource({ id: "test", backend, includes, excludes });
    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("LineBreak.txt");
    expect(result[0]?.dir).toBe("ucd");
  });

  it("should return empty array when no files match filters", async () => {
    const files = [createFile({ dir: "emoji" })];
    const backend = createMockBackend(files);
    const includes = (ctx: any) => ctx.file.dir === "ucd";

    const source = definePipelineSource({ id: "test", backend, includes });
    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should return empty array when backend returns no files", async () => {
    const backend = createMockBackend([]);
    const source = definePipelineSource({ id: "test", backend });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should preserve all file properties and add source", async () => {
    const file = createFile({
      version: "16.0.0",
      dir: "ucd",
      path: "ucd/LineBreak.txt",
      name: "LineBreak.txt",
      ext: ".txt",
    });
    const backend = createMockBackend([file]);
    const source = definePipelineSource({ id: "test-source", backend });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result[0]).toBeDefined();
    expect(result[0]).toMatchObject({
      version: "16.0.0",
      dir: "ucd",
      path: "ucd/LineBreak.txt",
      name: "LineBreak.txt",
      ext: ".txt",
      source: { id: "test-source" },
    });
  });

  it("should handle multiple versions correctly", async () => {
    const backend = createMockBackend([createFile({ version: "15.0.0" })]);
    const source = definePipelineSource({ id: "test", backend });

    await resolveSourceFiles(source, "15.0.0");
    expect(backend.listFiles).toHaveBeenCalledWith("15.0.0");

    await resolveSourceFiles(source, "16.0.0");
    expect(backend.listFiles).toHaveBeenCalledWith("16.0.0");
  });
});

describe("resolveMultipleSourceFiles", () => {
  it("should resolve files from multiple sources", async () => {
    const source1Files = [createFile({ path: "ucd/LineBreak.txt" })];
    const source2Files = [createFile({ path: "emoji/data.txt", dir: "emoji" })];

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
    expectTypeOf(result).toEqualTypeOf<SourceFileContext[]>();
  });

  it("should deduplicate files by path (last source wins)", async () => {
    const source1Files = [
      createFile({ path: "ucd/LineBreak.txt", name: "LineBreak.txt" }),
    ];
    const source2Files = [
      createFile({ path: "ucd/LineBreak.txt", name: "LineBreak.txt" }),
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
    expect(result[0]?.path).toBe("ucd/LineBreak.txt");
  });

  it("should handle empty sources array", async () => {
    const result = await resolveMultipleSourceFiles([], "16.0.0");

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
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
      createFile({ path: "ucd/LineBreak.txt", dir: "ucd", name: "LineBreak.txt" }),
      createFile({ path: "ucd/ReadMe.txt", dir: "ucd", name: "ReadMe.txt" }),
    ];
    const source2Files = [
      createFile({ path: "emoji/data.txt", dir: "emoji", name: "data.txt" }),
    ];

    const source1 = definePipelineSource({
      id: "source1",
      backend: createMockBackend(source1Files),
      excludes: (ctx: any) => ctx.file.name === "ReadMe.txt",
    });
    const source2 = definePipelineSource({
      id: "source2",
      backend: createMockBackend(source2Files),
    });

    const result = await resolveMultipleSourceFiles([source1, source2], "16.0.0");

    expect(result).toHaveLength(2);
    expect(result.some((f) => f.name === "ReadMe.txt")).toBe(false);
    expect(result.map((f) => f.name).sort()).toEqual(["LineBreak.txt", "data.txt"]);
  });

  it("should handle mix of filtered and unfiltered sources", async () => {
    const source1 = definePipelineSource({
      id: "filtered",
      backend: createMockBackend([
        createFile({ path: "ucd/A.txt", name: "A.txt" }),
        createFile({ path: "ucd/B.txt", name: "B.txt" }),
      ]),
      includes: (ctx: any) => ctx.file.name === "A.txt",
    });
    const source2 = definePipelineSource({
      id: "unfiltered",
      backend: createMockBackend([
        createFile({ path: "emoji/C.txt", name: "C.txt", dir: "emoji" }),
      ]),
    });

    const result = await resolveMultipleSourceFiles([source1, source2], "16.0.0");

    expect(result).toHaveLength(2);
    expect(result.map((f) => f.name).sort()).toEqual(["A.txt", "C.txt"]);
  });

  it("should preserve source id in deduplication", async () => {
    const sharedPath = "shared/file.txt";
    const source1 = definePipelineSource({
      id: "first",
      backend: createMockBackend([createFile({ path: sharedPath, dir: "shared" })]),
    });
    const source2 = definePipelineSource({
      id: "second",
      backend: createMockBackend([createFile({ path: sharedPath, dir: "shared" })]),
    });
    const source3 = definePipelineSource({
      id: "third",
      backend: createMockBackend([createFile({ path: sharedPath, dir: "shared" })]),
    });

    const result = await resolveMultipleSourceFiles([source1, source2, source3], "16.0.0");

    expect(result).toHaveLength(1);
    expect(result[0]?.source.id).toBe("third"); // Last one wins
  });
});

describe("type inference", () => {
  describe("inferSourceId", () => {
    it("should infer literal source id from definition", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const source = definePipelineSource({
        id: "my-source",
        backend: createMockBackend([]),
      });

      type SourceId = InferSourceId<typeof source>;
      expectTypeOf<SourceId>().toEqualTypeOf<"my-source">();
      expectTypeOf<SourceId>().not.toEqualTypeOf<string>();
    });

    it("should work with different id types", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const unicodeSource = definePipelineSource({
        id: "unicode",
        backend: createMockBackend([]),
      });
      // eslint-disable-next-line unused-imports/no-unused-vars
      const emojiSource = definePipelineSource({
        id: "emoji",
        backend: createMockBackend([]),
      });

      type UnicodeId = InferSourceId<typeof unicodeSource>;
      type EmojiId = InferSourceId<typeof emojiSource>;

      expectTypeOf<UnicodeId>().toEqualTypeOf<"unicode">();
      expectTypeOf<EmojiId>().toEqualTypeOf<"emoji">();
      expectTypeOf<UnicodeId>().not.toEqualTypeOf<EmojiId>();
    });
  });

  describe("inferSourceIds", () => {
    it("should infer multiple source ids as union", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const sources = [
        definePipelineSource({ id: "source1", backend: createMockBackend([]) }),
        definePipelineSource({ id: "source2", backend: createMockBackend([]) }),
      ] as const;

      type SourceIds = InferSourceIds<typeof sources>;
      expectTypeOf<SourceIds>().toEqualTypeOf<"source1" | "source2">();
    });

    it("should work with single source", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const sources = [
        definePipelineSource({ id: "only", backend: createMockBackend([]) }),
      ] as const;

      type SourceIds = InferSourceIds<typeof sources>;
      expectTypeOf<SourceIds>().toEqualTypeOf<"only">();
    });

    it("should work with triple sources", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const sources = [
        definePipelineSource({ id: "first", backend: createMockBackend([]) }),
        definePipelineSource({ id: "second", backend: createMockBackend([]) }),
        definePipelineSource({ id: "third", backend: createMockBackend([]) }),
      ] as const;

      type SourceIds = InferSourceIds<typeof sources>;
      expectTypeOf<SourceIds>().toEqualTypeOf<"first" | "second" | "third">();
    });

    it("should require readonly tuple for proper inference", () => {
      // Without 'as const', type is wider
      const sources = [
        definePipelineSource({ id: "source1", backend: createMockBackend([]) }),
        definePipelineSource({ id: "source2", backend: createMockBackend([]) }),
      ];

      // This will be PipelineSourceDefinition[] not a tuple
      expectTypeOf(sources).toExtend<PipelineSourceDefinition[]>();
    });
  });

  describe("sourceFileContext", () => {
    it("should extend FileContext with source", async () => {
      const source = definePipelineSource({
        id: "test-source",
        backend: createMockBackend([createFile()]),
      });

      const result = await resolveSourceFiles(source, "16.0.0");
      const file = result[0]!;

      expectTypeOf(file).toEqualTypeOf<SourceFileContext>();
      expectTypeOf(file).toExtend<FileContext>();
      expectTypeOf(file.source).toEqualTypeOf<{ id: string }>();
      expectTypeOf(file.source.id).toEqualTypeOf<string>();
      expectTypeOf(file.version).toEqualTypeOf<string>();
      expectTypeOf(file.path).toEqualTypeOf<string>();
      expectTypeOf(file.name).toEqualTypeOf<string>();
    });

    it("should have all FileContext properties", () => {
      const fileContext: SourceFileContext = {
        version: "16.0.0",
        dir: "ucd",
        path: "ucd/test.txt",
        name: "test.txt",
        ext: ".txt",
        source: { id: "test" },
      };

      expectTypeOf(fileContext.version).toEqualTypeOf<string>();
      expectTypeOf(fileContext.dir).toExtend<string>();
      expectTypeOf(fileContext.path).toEqualTypeOf<string>();
      expectTypeOf(fileContext.name).toEqualTypeOf<string>();
      expectTypeOf(fileContext.ext).toEqualTypeOf<string>();
      expectTypeOf(fileContext.source).toEqualTypeOf<{ id: string }>();
    });
  });
});

describe("edge cases", () => {
  it("should handle files with special characters in path", async () => {
    const files = [
      createFile({ path: "ucd/NamesList-16.0.0d1.txt", name: "NamesList-16.0.0d1.txt" }),
    ];
    const backend = createMockBackend(files);
    const source = definePipelineSource({ id: "test", backend });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe("ucd/NamesList-16.0.0d1.txt");
  });

  it("should handle filter that always returns false", async () => {
    const files = [createFile(), createFile({ path: "ucd/other.txt" })];
    const backend = createMockBackend(files);
    const source = definePipelineSource({
      id: "test",
      backend,
      includes: () => false,
    });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(0);
  });

  it("should handle filter that always returns true", async () => {
    const files = [createFile(), createFile({ path: "ucd/other.txt" })];
    const backend = createMockBackend(files);
    const source = definePipelineSource({
      id: "test",
      backend,
      excludes: () => false,
    });

    const result = await resolveSourceFiles(source, "16.0.0");

    expect(result).toHaveLength(2);
  });

  it("should handle complex deduplication scenario", async () => {
    const path1 = "shared/file1.txt";
    const path2 = "shared/file2.txt";

    const sources = [
      definePipelineSource({
        id: "s1",
        backend: createMockBackend([
          createFile({ path: path1, dir: "shared", name: "file1.txt" }),
          createFile({ path: path2, dir: "shared", name: "file2.txt" }),
        ]),
      }),
      definePipelineSource({
        id: "s2",
        backend: createMockBackend([
          createFile({ path: path1, dir: "shared", name: "file1.txt" }),
        ]),
      }),
      definePipelineSource({
        id: "s3",
        backend: createMockBackend([
          createFile({ path: path2, dir: "shared", name: "file2.txt" }),
        ]),
      }),
    ];

    const result = await resolveMultipleSourceFiles(sources, "16.0.0");

    expect(result).toHaveLength(2);
    expect(result.find((f) => f.path === path1)?.source.id).toBe("s2");
    expect(result.find((f) => f.path === path2)?.source.id).toBe("s3");
  });

  it("should maintain insertion order for non-duplicate files", async () => {
    const sources = [
      definePipelineSource({
        id: "s1",
        backend: createMockBackend([
          createFile({ path: "a.txt", name: "a.txt" }),
          createFile({ path: "b.txt", name: "b.txt" }),
        ]),
      }),
      definePipelineSource({
        id: "s2",
        backend: createMockBackend([
          createFile({ path: "c.txt", name: "c.txt" }),
        ]),
      }),
    ];

    const result = await resolveMultipleSourceFiles(sources, "16.0.0");

    expect(result.map((f) => f.name)).toEqual(["a.txt", "b.txt", "c.txt"]);
  });
});

import type { FileContext, ParseContext, ParsedRow } from "../src/types";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  definePipelineArtifact,
  type InferArtifactId,
  type InferArtifactsMap,
  type InferArtifactValue,
  type PipelineArtifactDefinition,
} from "../src/artifact";
import { byName } from "../src/filters";
import { definePipeline } from "../src/pipeline";
import { definePipelineRoute } from "../src/route";

function createMockSource(files: Record<string, Record<string, string>>) {
  return {
    listFiles: async (version: string): Promise<FileContext[]> => {
      const versionFiles = files[version] ?? {};
      return Object.keys(versionFiles).map((path) => ({
        path,
        name: path.split("/").pop() ?? path,
        dir: path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "",
        ext: path.includes(".") ? path.substring(path.lastIndexOf(".")) : "",
        version,
      }));
    },
    readFile: async (file: FileContext): Promise<string> => {
      const versionFiles = files[file.version] ?? {};
      return versionFiles[file.path] ?? "";
    },
  };
}

function createRow(ctx: ParseContext, props: Partial<ParsedRow>): ParsedRow {
  return {
    sourceFile: ctx.file.path,
    kind: props.codePoint ? "point" : "range",
    ...props,
  };
}

describe("definePipelineArtifact", () => {
  it("should create an artifact definition with id and build function", () => {
    const artifact = definePipelineArtifact({
      id: "test-artifact",
      build: async () => ({ value: 42 }),
    });

    expect(artifact.id).toBe("test-artifact");
    expect(typeof artifact.build).toBe("function");
  });

  it("should preserve the artifact id as a literal type", () => {
    const artifact = definePipelineArtifact({
      id: "my-specific-id",
      build: async () => "result",
    });

    expectTypeOf(artifact.id).toEqualTypeOf<"my-specific-id">();
  });

  it("should infer the build return type", () => {
    const mapArtifact = definePipelineArtifact({
      id: "map-artifact",
      build: async () => new Map<string, number>(),
    });

    const setArtifact = definePipelineArtifact({
      id: "set-artifact",
      build: async () => new Set<string>(),
    });

    const objectArtifact = definePipelineArtifact({
      id: "object-artifact",
      build: async () => ({ count: 0, names: ["a", "b"] }),
    });

    expectTypeOf<InferArtifactValue<typeof mapArtifact>>().toEqualTypeOf<Map<string, number>>();
    expectTypeOf<InferArtifactValue<typeof setArtifact>>().toEqualTypeOf<Set<string>>();
    expectTypeOf<InferArtifactValue<typeof objectArtifact>>().toEqualTypeOf<{ count: number; names: string[] }>();
  });

  it("should support optional filter and parser", () => {
    const artifact = definePipelineArtifact({
      id: "with-parser",
      filter: byName("PropertyValueAliases.txt"),
      parser: async function* (ctx) {
        for await (const line of ctx.readLines()) {
          if (!ctx.isComment(line)) {
            yield createRow(ctx, { property: line, value: line });
          }
        }
      },
      build: async (_ctx, rows) => {
        const aliases = new Map<string, string[]>();
        if (rows) {
          for await (const row of rows) {
            if (row.property) {
              aliases.set(row.property, [row.value as string]);
            }
          }
        }
        return aliases;
      },
    });

    expect(artifact.filter).toBeDefined();
    expect(artifact.parser).toBeDefined();
    expectTypeOf<InferArtifactValue<typeof artifact>>().toEqualTypeOf<Map<string, string[]>>();
  });

  it("should receive version in build context", async () => {
    let receivedVersion: string | undefined;

    const artifact = definePipelineArtifact({
      id: "version-check",
      build: async (ctx) => {
        receivedVersion = ctx.version;
        return ctx.version;
      },
    });

    const route = definePipelineRoute({
      id: "dummy",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx) => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      artifacts: [artifact],
      routes: [route],
    });

    await pipeline.run();

    expect(receivedVersion).toBe("16.0.0");
  });

  it("should build artifacts before routes execute", async () => {
    const executionOrder: string[] = [];

    const artifact = definePipelineArtifact({
      id: "first",
      build: async () => {
        executionOrder.push("artifact:build");
        return 42;
      },
    });

    const route = definePipelineRoute({
      id: "second",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        executionOrder.push("route:parse");
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows) => {
        for await (const _row of rows) {
          // consume rows to trigger parser
        }
        executionOrder.push("route:resolve");
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      artifacts: [artifact],
      routes: [route],
    });

    await pipeline.run();

    expect(executionOrder[0]).toBe("artifact:build");
    expect(executionOrder).toContain("route:parse");
    expect(executionOrder).toContain("route:resolve");
  });

  it("should make artifact values available in resolver via getArtifact", async () => {
    const aliasArtifact = definePipelineArtifact({
      id: "aliases",
      build: async () => new Map([["A", "LATIN CAPITAL LETTER A"]]),
    });

    let retrievedValue: Map<string, string> | undefined;

    const route = definePipelineRoute({
      id: "consumer",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0041", property: "A", value: "A" });
      },
      resolver: async (ctx) => {
        retrievedValue = ctx.getArtifact("aliases") as Map<string, string> | undefined;
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      artifacts: [aliasArtifact],
      routes: [route],
    });

    await pipeline.run();

    expect(retrievedValue).toBeInstanceOf(Map);
    expect(retrievedValue?.get("A")).toBe("LATIN CAPITAL LETTER A");
  });

  it("should rebuild artifacts for each version", async () => {
    const buildCalls: string[] = [];

    const artifact = definePipelineArtifact({
      id: "per-version",
      build: async (ctx) => {
        buildCalls.push(ctx.version);
        return ctx.version;
      },
    });

    const route = definePipelineRoute({
      id: "dummy",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx) => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    const pipeline = definePipeline({
      versions: ["16.0.0", "15.1.0", "14.0.0"],
      source: createMockSource({
        "16.0.0": { "test.txt": "a" },
        "15.1.0": { "test.txt": "b" },
        "14.0.0": { "test.txt": "c" },
      }),
      artifacts: [artifact],
      routes: [route],
    });

    await pipeline.run();

    expect(buildCalls).toEqual(["16.0.0", "15.1.0", "14.0.0"]);
  });

  it("should emit artifact events", async () => {
    const events: string[] = [];

    const artifact = definePipelineArtifact({
      id: "event-test",
      build: async () => "value",
    });

    const route = definePipelineRoute({
      id: "dummy",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx) => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      artifacts: [artifact],
      routes: [route],
      onEvent: (event) => {
        if (event.type.startsWith("artifact:")) {
          events.push(event.type);
        }
      },
    });

    await pipeline.run();

    expect(events).toContain("artifact:start");
    expect(events).toContain("artifact:end");
  });

  it("should handle artifact build errors", async () => {
    const artifact = definePipelineArtifact({
      id: "failing",
      build: async () => {
        throw new Error("Artifact build failed");
      },
    });

    const route = definePipelineRoute({
      id: "dummy",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx) => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      artifacts: [artifact],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.scope).toBe("artifact");
    expect(result.errors[0]!.artifactId).toBe("failing");
    expect(result.errors[0]!.message).toBe("Artifact build failed");
  });
});

describe("artifact type inference", () => {
  it("should infer artifact id type", () => {
    const artifact = definePipelineArtifact({
      id: "specific-id",
      build: async () => 42,
    });

    type Id = InferArtifactId<typeof artifact>;
    expectTypeOf<Id>().toEqualTypeOf<"specific-id">();
  });

  it("should infer artifact value type", () => {
    const artifact = definePipelineArtifact({
      id: "typed-value",
      build: async () => ({ nested: { deep: true }, array: [1, 2, 3] }),
    });

    type Value = InferArtifactValue<typeof artifact>;
    expectTypeOf<Value>().toEqualTypeOf<{ nested: { deep: boolean }; array: number[] }>();
  });

  it("should infer artifacts map from array of artifacts", () => {
    const aliasArtifact = definePipelineArtifact({
      id: "aliases",
      build: async () => new Map<string, string[]>(),
    });

    const countArtifact = definePipelineArtifact({
      id: "count",
      build: async () => 42,
    });

    const configArtifact = definePipelineArtifact({
      id: "config",
      build: async () => ({ enabled: true, threshold: 0.5 }),
    });

    type ArtifactsMap = InferArtifactsMap<[typeof aliasArtifact, typeof countArtifact, typeof configArtifact]>;

    expectTypeOf<ArtifactsMap>().toEqualTypeOf<{
      aliases: Map<string, string[]>;
      count: number;
      config: { enabled: boolean; threshold: number };
    }>();
  });

  it("should type PipelineArtifactDefinition with generics", () => {
    type MapArtifact = PipelineArtifactDefinition<"map-id", Map<string, number>>;

    const artifact: MapArtifact = {
      id: "map-id",
      build: async () => new Map(),
    };

    expectTypeOf(artifact.id).toEqualTypeOf<"map-id">();
    expectTypeOf(artifact.build).returns.resolves.toEqualTypeOf<Map<string, number>>();
  });
});

import type { CacheStore } from "../src/cache";
import type { PipelineExecutor } from "../src/executor";
import type {
  FileContext,
  ParseContext,
  ParsedRow,
  PipelineEvent,
  PipelineRouteDefinition,
  PipelineSourceDefinition,
  SourceBackend,
} from "@ucdjs/pipelines-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCacheStore } from "../src/cache";
import { createPipelineExecutor } from "../src/executor";
import { definePipeline, definePipelineRoute, definePipelineSource } from "@ucdjs/pipelines-core";

function createMockFile(name: string, dir: string = "ucd"): FileContext {
  return {
    version: "16.0.0",
    dir,
    path: `${dir}/${name}`,
    name,
    ext: name.includes(".") ? `.${name.split(".").pop()}` : "",
  };
}

function createMockBackend(files: FileContext[], contents: Record<string, string> = {}): SourceBackend {
  return {
    listFiles: vi.fn().mockResolvedValue(files),
    readFile: vi.fn().mockImplementation((file: FileContext) => {
      return Promise.resolve(contents[file.path] ?? "");
    }),
  };
}

async function* mockParser(ctx: ParseContext): AsyncIterable<ParsedRow> {
  const content = await ctx.readContent();
  const lines = content.split("\n").filter((line) => !ctx.isComment(line));

  for (const line of lines) {
    const [codePoint, value] = line.split(";").map((s) => s.trim());
    if (codePoint && value) {
      yield {
        sourceFile: ctx.file.path,
        kind: "point",
        codePoint,
        value,
      };
    }
  }
}

function createTestRoute(
  id: string,
  filter: (ctx: { file: FileContext }) => boolean,
): PipelineRouteDefinition<string, any, any, any, any> {
  return definePipelineRoute({
    id,
    filter,
    parser: mockParser,
    resolver: async (ctx, rows) => {
      const entries: Array<{ codePoint: string; value: string }> = [];
      for await (const row of rows) {
        entries.push({
          codePoint: row.codePoint!,
          value: row.value as string,
        });
      }
      return {
        version: ctx.version,
        file: ctx.file.name,
        entries,
      };
    },
  });
}

function createTestSource(files: FileContext[], contents: Record<string, string> = {}): PipelineSourceDefinition {
  return definePipelineSource({
    id: "test-source",
    backend: createMockBackend(files, contents),
  });
}

describe("createPipelineExecutor", () => {
  it("should create an executor with run and runSingle methods", () => {
    const executor = createPipelineExecutor({
      pipelines: [],
    });

    expect(executor).toHaveProperty("run");
    expect(executor).toHaveProperty("runSingle");
    expect(typeof executor.run).toBe("function");
    expect(typeof executor.runSingle).toBe("function");
  });

  it("should accept pipelines and optional artifacts", () => {
    const pipeline = definePipeline({
      id: "test",
      versions: ["16.0.0"],
      inputs: [createTestSource([])],
      routes: [],
    });

    const executor = createPipelineExecutor({
      pipelines: [pipeline],
      artifacts: [],
    });

    expect(executor).toBeDefined();
  });

  it("should accept optional cache store", () => {
    const cacheStore = createMemoryCacheStore();

    const executor = createPipelineExecutor({
      pipelines: [],
      cacheStore,
    });

    expect(executor).toBeDefined();
  });

  it("should accept optional event handler", () => {
    const onEvent = vi.fn();

    const executor = createPipelineExecutor({
      pipelines: [],
      onEvent,
    });

    expect(executor).toBeDefined();
  });
});

describe("executor.run", () => {
  let executor: PipelineExecutor;
  let files: FileContext[];
  let contents: Record<string, string>;

  beforeEach(() => {
    files = [
      createMockFile("LineBreak.txt"),
      createMockFile("Scripts.txt"),
    ];

    contents = {
      "ucd/LineBreak.txt": "0041;AL\n0042;AL",
      "ucd/Scripts.txt": "0041;Latin\n0042;Latin",
    };

    const source = createTestSource(files, contents);
    const routes = [
      createTestRoute("line-break", (ctx) => ctx.file.name === "LineBreak.txt"),
      createTestRoute("scripts", (ctx) => ctx.file.name === "Scripts.txt"),
    ];

    const pipeline = definePipeline({
      id: "test-pipeline",
      versions: ["16.0.0"],
      inputs: [source],
      routes,
    });

    executor = createPipelineExecutor({
      pipelines: [pipeline],
    });
  });

  it("should run all pipelines and return results", async () => {
    const result = await executor.run();

    expect(result.results).toBeInstanceOf(Map);
    expect(result.results.size).toBe(1);
    expect(result.results.has("test-pipeline")).toBe(true);
  });

  it("should return summary with pipeline counts", async () => {
    const result = await executor.run();

    expect(result.summary).toEqual({
      totalPipelines: 1,
      successfulPipelines: 1,
      failedPipelines: 0,
      durationMs: expect.any(Number),
    });
  });

  it("should process files matching routes", async () => {
    const result = await executor.run();
    const pipelineResult = result.results.get("test-pipeline")!;

    expect(pipelineResult.data.length).toBe(2);
  });

  it("should filter pipelines by id when specified", async () => {
    const result = await executor.run({ pipelines: ["test-pipeline"] });

    expect(result.results.has("test-pipeline")).toBe(true);
  });

  it("should skip pipelines not in filter list", async () => {
    const result = await executor.run({ pipelines: ["non-existent"] });

    expect(result.results.size).toBe(0);
  });

  it("should filter versions when specified", async () => {
    const result = await executor.run({ versions: ["16.0.0"] });
    const pipelineResult = result.results.get("test-pipeline")!;

    expect(pipelineResult.summary.versions).toEqual(["16.0.0"]);
  });
});

describe("executor.runSingle", () => {
  let executor: PipelineExecutor;
  let files: FileContext[];
  let contents: Record<string, string>;

  beforeEach(() => {
    files = [createMockFile("LineBreak.txt")];
    contents = { "ucd/LineBreak.txt": "0041;AL" };

    const source = createTestSource(files, contents);
    const route = createTestRoute("line-break", (ctx) => ctx.file.name === "LineBreak.txt");

    const pipeline = definePipeline({
      id: "test-pipeline",
      versions: ["16.0.0"],
      inputs: [source],
      routes: [route],
    });

    executor = createPipelineExecutor({
      pipelines: [pipeline],
    });
  });

  it("should run a single pipeline by id", async () => {
    const result = await executor.runSingle("test-pipeline");

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.graph).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it("should throw error for unknown pipeline id", async () => {
    await expect(executor.runSingle("unknown")).rejects.toThrow(
      'Pipeline "unknown" not found',
    );
  });

  it("should return pipeline run result", async () => {
    const result = await executor.runSingle("test-pipeline");

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
  });

  it("should accept version filter", async () => {
    const result = await executor.runSingle("test-pipeline", {
      versions: ["16.0.0"],
    });

    expect(result.summary.versions).toEqual(["16.0.0"]);
  });

  it("should respect cache option", async () => {
    const cacheStore = createMemoryCacheStore();

    const executor = createPipelineExecutor({
      pipelines: [
        definePipeline({
          id: "cached-pipeline",
          versions: ["16.0.0"],
          inputs: [createTestSource(files, contents)],
          routes: [createTestRoute("line-break", (ctx) => ctx.file.name === "LineBreak.txt")],
        }),
      ],
      cacheStore,
    });

    await executor.runSingle("cached-pipeline", { cache: true });
    const stats = await cacheStore.stats?.();

    expect(stats?.entries).toBeGreaterThanOrEqual(0);
  });
});

describe("pipeline events", () => {
  it("should emit pipeline:start and pipeline:end events", async () => {
    const events: PipelineEvent[] = [];
    const onEvent = vi.fn((event: PipelineEvent) => {
      events.push(event);
    });

    const pipeline = definePipeline({
      id: "event-test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      pipelines: [pipeline],
      onEvent,
    });

    await executor.runSingle("event-test");

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("pipeline:start");
    expect(eventTypes).toContain("pipeline:end");
  });

  it("should emit version:start and version:end events", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "version-events",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      pipelines: [pipeline],
      onEvent: (event) => events.push(event),
    });

    await executor.runSingle("version-events");

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("version:start");
    expect(eventTypes).toContain("version:end");
  });

  it("should emit parse and resolve events", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "parse-events",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      pipelines: [pipeline],
      onEvent: (event) => events.push(event),
    });

    await executor.runSingle("parse-events");

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("parse:start");
    expect(eventTypes).toContain("parse:end");
    expect(eventTypes).toContain("resolve:start");
    expect(eventTypes).toContain("resolve:end");
  });

  it("should emit file:matched event when file matches route", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "file-matched",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      pipelines: [pipeline],
      onEvent: (event) => events.push(event),
    });

    await executor.runSingle("file-matched");

    const matchedEvents = events.filter((e) => e.type === "file:matched");
    expect(matchedEvents.length).toBeGreaterThan(0);
  });
});

describe("pipeline graph", () => {
  it("should build graph with source nodes", async () => {
    const pipeline = definePipeline({
      id: "graph-test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("graph-test");

    const sourceNodes = result.graph.nodes.filter((n) => n.type === "source");
    expect(sourceNodes.length).toBe(1);
  });

  it("should build graph with file nodes", async () => {
    const pipeline = definePipeline({
      id: "graph-files",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("graph-files");

    const fileNodes = result.graph.nodes.filter((n) => n.type === "file");
    expect(fileNodes.length).toBe(1);
  });

  it("should build graph with route nodes", async () => {
    const pipeline = definePipeline({
      id: "graph-routes",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("graph-routes");

    const routeNodes = result.graph.nodes.filter((n) => n.type === "route");
    expect(routeNodes.length).toBe(1);
  });

  it("should build graph with output nodes", async () => {
    const pipeline = definePipeline({
      id: "graph-outputs",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("graph-outputs");

    const outputNodes = result.graph.nodes.filter((n) => n.type === "output");
    expect(outputNodes.length).toBeGreaterThan(0);
  });

  it("should build graph with edges", async () => {
    const pipeline = definePipeline({
      id: "graph-edges",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("graph-edges");

    expect(result.graph.edges.length).toBeGreaterThan(0);
  });
});

describe("pipeline summary", () => {
  it("should track total files", async () => {
    const files = [
      createMockFile("File1.txt"),
      createMockFile("File2.txt"),
      createMockFile("File3.txt"),
    ];
    const contents = {
      "ucd/File1.txt": "0041;A",
      "ucd/File2.txt": "0042;B",
      "ucd/File3.txt": "0043;C",
    };

    const pipeline = definePipeline({
      id: "summary-total",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("all", () => true)],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("summary-total");

    expect(result.summary.totalFiles).toBe(3);
  });

  it("should track matched files", async () => {
    const files = [
      createMockFile("Match1.txt"),
      createMockFile("Match2.txt"),
      createMockFile("NoMatch.txt"),
    ];
    const contents = {
      "ucd/Match1.txt": "0041;A",
      "ucd/Match2.txt": "0042;B",
      "ucd/NoMatch.txt": "0043;C",
    };

    const pipeline = definePipeline({
      id: "summary-matched",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("match", (ctx) => ctx.file.name.startsWith("Match"))],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("summary-matched");

    expect(result.summary.matchedFiles).toBe(2);
  });

  it("should track skipped files", async () => {
    const files = [
      createMockFile("Process.txt"),
      createMockFile("Skip.txt"),
    ];
    const contents = {
      "ucd/Process.txt": "0041;A",
      "ucd/Skip.txt": "0042;B",
    };

    const pipeline = definePipeline({
      id: "summary-skipped",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("process", (ctx) => ctx.file.name === "Process.txt")],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("summary-skipped");

    expect(result.summary.skippedFiles).toBe(1);
  });

  it("should track duration", async () => {
    const pipeline = definePipeline({
      id: "summary-duration",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("summary-duration");

    expect(result.summary.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should track total outputs", async () => {
    const files = [
      createMockFile("File1.txt"),
      createMockFile("File2.txt"),
    ];
    const contents = {
      "ucd/File1.txt": "0041;A",
      "ucd/File2.txt": "0042;B",
    };

    const pipeline = definePipeline({
      id: "summary-outputs",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("all", () => true)],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("summary-outputs");

    expect(result.summary.totalOutputs).toBe(2);
  });
});

describe("error handling", () => {
  it("should capture route errors without stopping execution", async () => {
    const failingRoute = definePipelineRoute({
      id: "failing",
      filter: () => true,
      parser: mockParser,
      resolver: async () => {
        throw new Error("Route failed");
      },
    });

    const pipeline = definePipeline({
      id: "error-test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [failingRoute],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("error-test");

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].scope).toBe("route");
    expect(result.errors[0].message).toContain("Route failed");
  });

  it("should emit error events", async () => {
    const events: PipelineEvent[] = [];

    const failingRoute = definePipelineRoute({
      id: "failing",
      filter: () => true,
      parser: mockParser,
      resolver: async () => {
        throw new Error("Test error");
      },
    });

    const pipeline = definePipeline({
      id: "error-events",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [failingRoute],
    });

    const executor = createPipelineExecutor({
      pipelines: [pipeline],
      onEvent: (event) => events.push(event),
    });

    await executor.runSingle("error-events");

    const errorEvents = events.filter((e) => e.type === "error");
    expect(errorEvents.length).toBeGreaterThan(0);
  });

  it("should handle pipeline without inputs gracefully", async () => {
    const pipeline = definePipeline({
      id: "no-inputs",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });

    await expect(executor.runSingle("no-inputs")).rejects.toThrow(
      "Pipeline requires at least one input source",
    );
  });
});

describe("caching", () => {
  let cacheStore: CacheStore;

  beforeEach(() => {
    cacheStore = createMemoryCacheStore();
  });

  it("should use cache when enabled", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "cache-test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      pipelines: [pipeline],
      cacheStore,
      onEvent: (event) => events.push(event),
    });

    await executor.runSingle("cache-test", { cache: true });

    const cacheEvents = events.filter((e) =>
      e.type === "cache:hit" || e.type === "cache:miss" || e.type === "cache:store",
    );
    expect(cacheEvents.length).toBeGreaterThan(0);
  });

  it("should hit cache on second run", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "cache-hit-test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      pipelines: [pipeline],
      cacheStore,
      onEvent: (event) => events.push(event),
    });

    await executor.runSingle("cache-hit-test", { cache: true });

    events.length = 0;

    await executor.runSingle("cache-hit-test", { cache: true });

    const hitEvents = events.filter((e) => e.type === "cache:hit");
    expect(hitEvents.length).toBeGreaterThan(0);
  });

  it("should skip cache when disabled", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "cache-disabled",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      pipelines: [pipeline],
      cacheStore,
      onEvent: (event) => events.push(event),
    });

    await executor.runSingle("cache-disabled", { cache: false });

    const cacheEvents = events.filter((e) =>
      e.type === "cache:hit" || e.type === "cache:miss" || e.type === "cache:store",
    );
    expect(cacheEvents).toEqual([]);
  });
});

describe("multiple pipelines", () => {
  it("should run multiple pipelines", async () => {
    const files = [createMockFile("Test.txt")];
    const contents = { "ucd/Test.txt": "0041;A" };

    const pipeline1 = definePipeline({
      id: "pipeline-1",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("route-1", () => true)],
    });

    const pipeline2 = definePipeline({
      id: "pipeline-2",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("route-2", () => true)],
    });

    const executor = createPipelineExecutor({
      pipelines: [pipeline1, pipeline2],
    });

    const result = await executor.run();

    expect(result.results.size).toBe(2);
    expect(result.results.has("pipeline-1")).toBe(true);
    expect(result.results.has("pipeline-2")).toBe(true);
  });

  it("should track successful and failed pipelines", async () => {
    const files = [createMockFile("Test.txt")];
    const contents = { "ucd/Test.txt": "0041;A" };

    const successPipeline = definePipeline({
      id: "success",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("ok", () => true)],
    });

    const failPipeline = definePipeline({
      id: "fail",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [
        definePipelineRoute({
          id: "fail-route",
          filter: () => true,
          parser: mockParser,
          resolver: async () => {
            throw new Error("Intentional failure");
          },
        }),
      ],
    });

    const executor = createPipelineExecutor({
      pipelines: [successPipeline, failPipeline],
    });

    const result = await executor.run();

    expect(result.summary.successfulPipelines).toBe(1);
    expect(result.summary.failedPipelines).toBe(1);
  });
});

describe("strict mode", () => {
  it("should error on unmatched files in strict mode", async () => {
    const files = [
      createMockFile("Matched.txt"),
      createMockFile("Unmatched.txt"),
    ];
    const contents = {
      "ucd/Matched.txt": "0041;A",
      "ucd/Unmatched.txt": "0042;B",
    };

    const pipeline = definePipeline({
      id: "strict-test",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("matched", (ctx) => ctx.file.name === "Matched.txt")],
      strict: true,
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("strict-test");

    const fileErrors = result.errors.filter((e) => e.scope === "file");
    expect(fileErrors.length).toBe(1);
    expect(fileErrors[0].message).toContain("No matching route");
  });

  it("should not error on unmatched files when not strict", async () => {
    const files = [
      createMockFile("Matched.txt"),
      createMockFile("Unmatched.txt"),
    ];
    const contents = {
      "ucd/Matched.txt": "0041;A",
      "ucd/Unmatched.txt": "0042;B",
    };

    const pipeline = definePipeline({
      id: "non-strict-test",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("matched", (ctx) => ctx.file.name === "Matched.txt")],
      strict: false,
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("non-strict-test");

    const fileErrors = result.errors.filter((e) => e.scope === "file");
    expect(fileErrors).toEqual([]);
  });
});

describe("fallback route", () => {
  it("should use fallback for unmatched files", async () => {
    const files = [
      createMockFile("Matched.txt"),
      createMockFile("Fallback.txt"),
    ];
    const contents = {
      "ucd/Matched.txt": "0041;A",
      "ucd/Fallback.txt": "0042;B",
    };

    const pipeline = definePipeline({
      id: "fallback-test",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("matched", (ctx) => ctx.file.name === "Matched.txt")],
      fallback: {
        parser: mockParser,
        resolver: async (ctx, rows) => {
          const entries: Array<{ codePoint: string; value: string }> = [];
          for await (const row of rows) {
            entries.push({ codePoint: row.codePoint!, value: row.value as string });
          }
          return { type: "fallback", file: ctx.file.name, entries };
        },
      },
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("fallback-test");

    expect(result.summary.fallbackFiles).toBe(1);
    expect(result.data.length).toBe(2);

    const fallbackOutput = result.data.find((d: any) => d.type === "fallback");
    expect(fallbackOutput).toBeDefined();
  });

  it("should emit file:fallback event", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "fallback-event",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Unmatched.txt")], { "ucd/Unmatched.txt": "0041;A" })],
      routes: [],
      fallback: {
        parser: mockParser,
        resolver: async () => ({ fallback: true }),
      },
    });

    const executor = createPipelineExecutor({
      pipelines: [pipeline],
      onEvent: (event) => events.push(event),
    });

    await executor.runSingle("fallback-event");

    const fallbackEvents = events.filter((e) => e.type === "file:fallback");
    expect(fallbackEvents.length).toBe(1);
  });
});

describe("include filter", () => {
  it("should only process files matching include filter", async () => {
    const files = [
      createMockFile("Include.txt"),
      createMockFile("Exclude.txt"),
    ];
    const contents = {
      "ucd/Include.txt": "0041;A",
      "ucd/Exclude.txt": "0042;B",
    };

    const pipeline = definePipeline({
      id: "include-test",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("all", () => true)],
      include: (ctx) => ctx.file.name.startsWith("Include"),
    });

    const executor = createPipelineExecutor({ pipelines: [pipeline] });
    const result = await executor.runSingle("include-test");

    expect(result.summary.matchedFiles).toBe(1);
    expect(result.data.length).toBe(1);
  });
});

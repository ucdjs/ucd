import type {
  FileContext,
  ParseContext,
  ParsedRow,
  PipelineEvent,
  PipelineRouteDefinition,
  PipelineSourceDefinition,
  SourceBackend,
} from "@ucdjs/pipelines-core";
import type { CacheStore } from "../src/cache";
import type { PipelineExecutor } from "../src/executor";
import { definePipeline, definePipelineRoute, definePipelineSource } from "@ucdjs/pipelines-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCacheStore } from "../src/cache";
import { createPipelineExecutor } from "../src/executor";

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
      for await (const row of rows as AsyncIterable<ParsedRow>) {
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
  it("should create an executor with run method", () => {
    const executor = createPipelineExecutor({});

    expect(executor).toHaveProperty("run");
    expect(typeof executor.run).toBe("function");
  });

  it("should accept pipelines and optional artifacts", () => {
    const pipeline = definePipeline({
      id: "test",
      name: "Test",
      versions: ["16.0.0"],
      inputs: [createTestSource([])],
      routes: [],
    });

    const executor = createPipelineExecutor({
      artifacts: [],
    });

    expect(executor).toBeDefined();
  });

  it("should accept optional cache store", () => {
    const cacheStore = createMemoryCacheStore();

    const executor = createPipelineExecutor({
      cacheStore,
    });

    expect(executor).toBeDefined();
  });

  it("should accept optional event handler", () => {
    const onEvent = vi.fn();

    const executor = createPipelineExecutor({
      onEvent,
    });

    expect(executor).toBeDefined();
  });
});

describe("executor.run", () => {
  let executor: PipelineExecutor;
  let files: FileContext[];
  let contents: Record<string, string>;
  let pipeline: ReturnType<typeof definePipeline>;

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

    pipeline = definePipeline({
      id: "test-pipeline",
      name: "Test Pipeline",
      versions: ["16.0.0"],
      inputs: [source],
      routes,
    });

    executor = createPipelineExecutor({});
  });

  it("should run all pipelines and return results", async () => {
    const result = await executor.run([pipeline as any]);

    expect(result.length).toBe(1);
    expect(result.some((item) => item.id === "test-pipeline")).toBe(true);
  });

  it("should return summary with pipeline counts", async () => {
    const result = await executor.run([pipeline as any]);

    expect(result.length).toBe(1);
  });

  it("should process files matching routes", async () => {
    const result = await executor.run([pipeline as any]);
    const pipelineResult = result.find((item) => item.id === "test-pipeline")!;

    expect(pipelineResult.data.length).toBe(2);
  });

  it("should run provided pipelines", async () => {
    const result = await executor.run([pipeline as any]);

    expect(result.some((item) => item.id === "test-pipeline")).toBe(true);
  });

  it("should return empty results when no pipelines provided", async () => {
    const result = await executor.run([]);

    expect(result.length).toBe(0);
  });

  it("should filter versions when specified", async () => {
    const result = await executor.run([pipeline as any], { versions: ["16.0.0"] });
    const pipelineResult = result.find((item) => item.id === "test-pipeline")!;

    expect(pipelineResult.summary.versions).toEqual(["16.0.0"]);
  });
});

describe("running single pipeline via run()", () => {
  let executor: PipelineExecutor;
  let files: FileContext[];
  let contents: Record<string, string>;
  let pipeline: ReturnType<typeof definePipeline>;

  beforeEach(() => {
    files = [createMockFile("LineBreak.txt")];
    contents = { "ucd/LineBreak.txt": "0041;AL" };

    const source = createTestSource(files, contents);
    const route = createTestRoute("line-break", (ctx) => ctx.file.name === "LineBreak.txt");

    pipeline = definePipeline({
      id: "test-pipeline",
      name: "Test Pipeline",
      versions: ["16.0.0"],
      inputs: [source],
      routes: [route],
    });

    executor = createPipelineExecutor({});
  });

  it("should run a single pipeline", async () => {
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "test-pipeline")!;

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.graph).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it("should return pipeline run result", async () => {
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "test-pipeline")!;

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
  });

  it("should accept version filter", async () => {
    const multi = await executor.run([pipeline], { versions: ["16.0.0"] });
    const result = multi.find((item) => item.id === "test-pipeline")!;

    expect(result.summary.versions).toEqual(["16.0.0"]);
  });

  it("should respect cache option", async () => {
    const cacheStore = createMemoryCacheStore();

    const cachedPipeline = definePipeline({
      id: "cached-pipeline",
      name: "Cached Pipeline",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("line-break", (ctx) => ctx.file.name === "LineBreak.txt")],
    });

    const ex = createPipelineExecutor({ cacheStore });

    await ex.run([cachedPipeline], { cache: true });
    const stats = await cacheStore.stats?.();

    expect(stats?.entries).toBeGreaterThanOrEqual(0);
  });

  it("should return empty results for unknown pipeline", async () => {
    const multi = await executor.run([]);
    expect(multi.length).toBe(0);
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
      name: "Event Test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({ onEvent });

    await executor.run([pipeline as any]);

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("pipeline:start");
    expect(eventTypes).toContain("pipeline:end");
    for (const event of events) {
      expect(event.spanId).toBeTruthy();
    }
  });

  it("should emit version:start and version:end events", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "version-events",
      name: "Version Events",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      onEvent: (event) => { events.push(event); return undefined; },
    });

    await executor.run([pipeline as any]);

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("version:start");
    expect(eventTypes).toContain("version:end");
  });

  it("should emit parse and resolve events", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "parse-events",
      name: "Parse Events",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      onEvent: (event) => { events.push(event); return undefined; },
    });

    await executor.run([pipeline as any]);

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
      name: "File Matched",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      onEvent: (event) => { events.push(event); return undefined; },
    });

    await executor.run([pipeline as any]);

    const matchedEvents = events.filter((e) => e.type === "file:matched");
    expect(matchedEvents.length).toBeGreaterThan(0);
  });
});

describe("pipeline graph", () => {
  it("should build graph with source nodes", async () => {
    const pipeline = definePipeline({
      id: "graph-test",
      name: "Graph Test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "graph-test")!;

    const sourceNodes = result.graph.nodes.filter((n) => n.type === "source");
    expect(sourceNodes.length).toBe(1);
  });

  it("should build graph with file nodes", async () => {
    const pipeline = definePipeline({
      id: "graph-files",
      name: "Graph Files",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "graph-files")!;

    const fileNodes = result.graph.nodes.filter((n) => n.type === "file");
    expect(fileNodes.length).toBe(1);
  });

  it("should build graph with route nodes", async () => {
    const pipeline = definePipeline({
      id: "graph-routes",
      name: "Graph Routes",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "graph-routes")!;

    const routeNodes = result.graph.nodes.filter((n) => n.type === "route");
    expect(routeNodes.length).toBe(1);
  });

  it("should build graph with output nodes", async () => {
    const pipeline = definePipeline({
      id: "graph-outputs",
      name: "Graph Outputs",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "graph-outputs")!;

    const outputNodes = result.graph.nodes.filter((n) => n.type === "output");
    expect(outputNodes.length).toBeGreaterThan(0);
  });

  it("should build graph with edges", async () => {
    const pipeline = definePipeline({
      id: "graph-edges",
      name: "Graph Edges",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "graph-edges")!;

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
      name: "Summary Total",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("all", () => true)],
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "summary-total")!;

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
      name: "Summary Matched",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("match", (ctx) => ctx.file.name.startsWith("Match"))],
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "summary-matched")!;

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
      name: "Summary Skipped",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("process", (ctx) => ctx.file.name === "Process.txt")],
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "summary-skipped")!;

    expect(result.summary.skippedFiles).toBe(1);
  });

  it("should track duration", async () => {
    const pipeline = definePipeline({
      id: "summary-duration",
      name: "Summary Duration",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "summary-duration")!;

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
      name: "Summary Outputs",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("all", () => true)],
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "summary-outputs")!;

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
      name: "Error Test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [failingRoute],
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "error-test")!;

    expect(result.errors.length).toBeGreaterThan(0);
    const firstError = result.errors[0]!;
    expect(firstError.scope).toBe("route");
    expect(firstError.message).toContain("Route failed");
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
      name: "Error Events",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [failingRoute],
    });

    const executor = createPipelineExecutor({
      onEvent: (event) => { events.push(event); return undefined; },
    });

    await executor.run([pipeline]);

    const errorEvents = events.filter((e) => e.type === "error");
    expect(errorEvents.length).toBeGreaterThan(0);
  });

  it("should handle pipeline without inputs gracefully", async () => {
    const pipeline = definePipeline({
      id: "no-inputs",
      name: "No Inputs",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });

    const executor = createPipelineExecutor({});

    const multi = await executor.run([pipeline as any]);
    const result = multi.find((item) => item.id === "no-inputs")!;
    expect(result.errors.length).toBeGreaterThan(0);
    const firstError = result.errors[0]!;
    expect(firstError.message).toContain("Pipeline requires at least one input source");
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
      name: "Cache Test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      cacheStore,
      onEvent: (event) => { events.push(event); return undefined; },
    });

    await executor.run([pipeline], { cache: true });

    const cacheEvents = events.filter((e) =>
      e.type === "cache:hit" || e.type === "cache:miss" || e.type === "cache:store",
    );
    expect(cacheEvents.length).toBeGreaterThan(0);
  });

  it("should hit cache on second run", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "cache-hit-test",
      name: "Cache Hit Test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      cacheStore,
      onEvent: (event) => {
        events.push(event);
        return undefined;
      },
    });

    await executor.run([pipeline], { cache: true });

    events.length = 0;

    await executor.run([pipeline], { cache: true });

    const hitEvents = events.filter((e) => e.type === "cache:hit");
    expect(hitEvents.length).toBeGreaterThan(0);
  });

  it("should skip cache when disabled", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "cache-disabled",
      name: "Cache Disabled",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Test.txt")], { "ucd/Test.txt": "0041;A" })],
      routes: [createTestRoute("test", () => true)],
    });

    const executor = createPipelineExecutor({
      cacheStore,
      onEvent: (event) => { events.push(event); return undefined; },
    });

    await executor.run([pipeline as any], { cache: false });

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
      name: "Pipeline 1",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("route-1", () => true)],
    });

    const pipeline2 = definePipeline({
      id: "pipeline-2",
      name: "Pipeline 2",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("route-2", () => true)],
    });

    const executor = createPipelineExecutor({});

    const result = await executor.run([pipeline1 as any, pipeline2 as any]);

    expect(result.length).toBe(2);
    expect(result.some((item) => item.id === "pipeline-1")).toBe(true);
    expect(result.some((item) => item.id === "pipeline-2")).toBe(true);
  });

  it("should track successful and failed pipelines", async () => {
    const files = [createMockFile("Test.txt")];
    const contents = { "ucd/Test.txt": "0041;A" };

    const successPipeline = definePipeline({
      id: "success",
      name: "Success",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("ok", () => true)],
    });

    const failPipeline = definePipeline({
      id: "fail",
      name: "Fail",
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

    const executor = createPipelineExecutor({});

    const result = await executor.run([successPipeline as any, failPipeline as any]);

    const success = result.find((item) => item.id === "success")!;
    const failure = result.find((item) => item.id === "fail")!;
    expect(success.status).toBe("completed");
    expect(failure.status).toBe("failed");
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
      name: "Strict Test",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("matched", (ctx) => ctx.file.name === "Matched.txt")],
      strict: true,
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "strict-test")!;

    const fileErrors = result.errors.filter((e) => e.scope === "file");
    expect(fileErrors.length).toBe(1);
    const firstFileError = fileErrors[0]!;
    expect(firstFileError.message).toContain("No matching route");
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
      name: "Non Strict Test",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("matched", (ctx) => ctx.file.name === "Matched.txt")],
      strict: false,
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "non-strict-test")!;

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
      name: "Fallback Test",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("matched", (ctx) => ctx.file.name === "Matched.txt")],
      fallback: {
        parser: mockParser,
        resolver: async (ctx: any, rows: AsyncIterable<ParsedRow>) => {
          const entries: Array<{ codePoint: string; value: string }> = [];
          for await (const row of rows) {
            entries.push({ codePoint: row.codePoint!, value: row.value as string });
          }
          return { type: "fallback", file: ctx.file.name, entries };
        },
      },
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "fallback-test")!;

    expect(result.summary.fallbackFiles).toBe(1);
    expect(result.data.length).toBe(2);

    const fallbackOutput = result.data.find((d: any) => d.type === "fallback");
    expect(fallbackOutput).toBeDefined();
  });

  it("should emit file:fallback event", async () => {
    const events: PipelineEvent[] = [];

    const pipeline = definePipeline({
      id: "fallback-event",
      name: "Fallback Event",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Unmatched.txt")], { "ucd/Unmatched.txt": "0041;A" })],
      routes: [],
      fallback: {
        parser: mockParser,
        resolver: async () => ({ fallback: true }),
      },
    }) as any;

    const executor = createPipelineExecutor({ onEvent: (event) => { events.push(event); return undefined; } });

    await executor.run([pipeline as any]);

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
      name: "Include Test",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("all", () => true)],
      include: (ctx) => ctx.file.name.startsWith("Include"),
    });

    const executor = createPipelineExecutor({});
    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "include-test")!;

    expect(result.summary.matchedFiles).toBe(1);
    expect(result.data.length).toBe(1);
  });
});

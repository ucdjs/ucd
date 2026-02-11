import type { FileContext, PipelineEvent } from "@ucdjs/pipelines-core";
import type { PipelineExecutionResult, PipelineExecutor } from "../src";
import type { PipelineSummary } from "../src/types";
import { definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { createMemoryCacheStore } from "../src/cache";
import { createPipelineExecutor } from "../src/executor";
import {
  createMockFile,
  createTestRoute,
  createTestSource,
  mockParser,
} from "./helpers";

describe("createPipelineExecutor", () => {
  it("should create an executor with run method", () => {
    const executor = createPipelineExecutor({});

    expect(executor).toHaveProperty("run");
    expect(typeof executor.run).toBe("function");
    expectTypeOf(executor.run).returns.toEqualTypeOf<Promise<PipelineExecutionResult[]>>();
  });

  it("should accept pipelines and optional artifacts", () => {
    definePipeline({
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
    const result = await executor.run([pipeline]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("test-pipeline");
    expect(result[0]?.summary.totalFiles).toBe(2);
    expect(result[0]?.summary.matchedFiles).toBe(2);
    expect(result[0]?.summary.totalOutputs).toBe(2);
    expect(result[0]?.errors).toEqual([]);
    expectTypeOf(result[0]!.summary).toMatchTypeOf<PipelineSummary>();
  });

  it("should process files matching routes", async () => {
    const result = await executor.run([pipeline]);
    const pipelineResult = result.find((item) => item.id === "test-pipeline")!;

    expect(pipelineResult.data.length).toBe(2);
    expect(pipelineResult.data[0]).toMatchObject({
      version: "16.0.0",
      entries: [
        { codePoint: "0041", value: expect.any(String) },
        { codePoint: "0042", value: expect.any(String) },
      ],
    });
  });

  it("should run provided pipelines", async () => {
    const result = await executor.run([pipeline]);

    expect(result.some((item) => item.id === "test-pipeline")).toBe(true);
  });

  it("should return empty results when no pipelines provided", async () => {
    const result = await executor.run([]);

    expect(result.length).toBe(0);
  });

  it("should filter versions when specified", async () => {
    const result = await executor.run([pipeline], { versions: ["16.0.0"] });
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
      onEvent: (event) => {
        events.push(event);
        return undefined;
      },
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

    const multi = await executor.run([pipeline]);
    const result = multi.find((item) => item.id === "no-inputs")!;
    expect(result.errors.length).toBeGreaterThan(0);
    const firstError = result.errors[0]!;
    expect(firstError.message).toContain("Pipeline requires at least one input source");
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

    const result = await executor.run([pipeline1, pipeline2]);

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

    const result = await executor.run([successPipeline, failPipeline]);

    const success = result.find((item) => item.id === "success")!;
    const failure = result.find((item) => item.id === "fail")!;
    expect(success.status).toBe("completed");
    expect(failure.status).toBe("failed");
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

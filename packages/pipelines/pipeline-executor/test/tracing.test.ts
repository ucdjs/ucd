import { SpanStatusCode } from "@opentelemetry/api";
import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createMemoryCacheStore } from "../src/cache";
import { createPipelineExecutor } from "../src/executor";
import { createNodeExecutionRuntime } from "../src/runtime/node";
import { createMockFile, createTestSource, mockParser } from "./helpers";
import { setupTestTracing } from "./helpers/tracing";

describe("tracing", () => {
  let otel: ReturnType<typeof setupTestTracing>;

  beforeAll(() => {
    otel = setupTestTracing();
  });

  afterAll(async () => {
    await otel.cleanup();
  });

  beforeEach(() => {
    otel.exporter.reset();
  });

  it("emits pipeline, version, source.listing, file.route, parse, resolve spans", async () => {
    const pipeline = definePipeline({
      id: "span-test",
      name: "Span Test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (ctx, rows) => {
            const entries = [];
            for await (const row of rows) {
              entries.push({ codePoint: row.codePoint!, value: row.value! });
            }
            return [{ version: ctx.version, entries }];
          },
        }),
      ],
    });

    await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    const names = otel.exporter.getFinishedSpans().map((s) => s.name);
    expect(names).toContain("pipeline");
    expect(names).toContain("version");
    expect(names).toContain("source.listing");
    expect(names).toContain("file.route");
    expect(names).toContain("parse");
    expect(names).toContain("resolve");
  });

  it("sets pipeline span attributes", async () => {
    const pipeline = definePipeline({
      id: "attr-test",
      name: "Attr Test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (_ctx, rows) => {
            for await (const _ of rows) { /* consume */ }
            return [];
          },
        }),
      ],
    });

    await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    const pipelineSpan = otel.exporter.getFinishedSpans().find((s) => s.name === "pipeline");
    expect(pipelineSpan).toBeDefined();
    expect(pipelineSpan?.attributes["pipeline.id"]).toBe("attr-test");
    expect(pipelineSpan?.attributes["pipeline.versions"]).toEqual(["16.0.0"]);
    expect(pipelineSpan?.attributes["execution.status"]).toBe("completed");
  });

  it("emits file.matched and source.provided events on file.route span", async () => {
    const pipeline = definePipeline({
      id: "event-test",
      name: "Event Test",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (_ctx, rows) => {
            for await (const _ of rows) { /* consume */ }
            return [];
          },
        }),
      ],
    });

    await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    const routeSpan = otel.exporter.getFinishedSpans().find((s) => s.name === "file.route");
    expect(routeSpan).toBeDefined();
    const eventNames = routeSpan?.events.map((e) => e.name) ?? [];
    expect(eventNames).toContain("file.matched");
    expect(eventNames).toContain("source.provided");
  });

  it("sets row.count and filtered.row.count on parse span", async () => {
    const pipeline = definePipeline({
      id: "parse-attrs",
      name: "Parse Attrs",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin\n0042;Latin\n0043;Greek",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (_ctx, rows) => {
            for await (const _ of rows) { /* consume */ }
            return [];
          },
        }),
      ],
    });

    await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    const parseSpan = otel.exporter.getFinishedSpans().find((s) => s.name === "parse");
    expect(parseSpan).toBeDefined();
    expect(parseSpan?.attributes["row.count"]).toBe(3);
    expect(parseSpan?.attributes["filtered.row.count"]).toBe(3);
  });

  it("sets output.count on resolve span", async () => {
    const pipeline = definePipeline({
      id: "resolve-attrs",
      name: "Resolve Attrs",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin\n0042;Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (_ctx, rows) => {
            const entries = [];
            for await (const row of rows) {
              entries.push({ codePoint: row.codePoint!, value: row.value! });
            }
            return [{ result: "a" }, { result: "b" }];
          },
        }),
      ],
    });

    await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    const resolveSpan = otel.exporter.getFinishedSpans().find((s) => s.name === "resolve");
    expect(resolveSpan).toBeDefined();
    expect(resolveSpan?.attributes["output.count"]).toBe(2);
  });

  it("emits cache.miss on first run and cache.hit on second run", async () => {
    const cacheStore = createMemoryCacheStore();
    const pipeline = definePipeline({
      id: "cache-spans",
      name: "Cache Spans",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (_ctx, rows) => {
            for await (const _ of rows) { /* consume */ }
            return [];
          },
        }),
      ],
    });

    const executor = createPipelineExecutor({ runtime: createNodeExecutionRuntime(), cacheStore });

    await executor.run([pipeline], { cache: true });
    const firstRunEvents = otel.exporter.getFinishedSpans()
      .flatMap((s) => s.events.map((e) => e.name));
    expect(firstRunEvents).toContain("cache.miss");
    expect(firstRunEvents).not.toContain("cache.hit");

    otel.exporter.reset();

    await executor.run([pipeline], { cache: true });
    const secondRunEvents = otel.exporter.getFinishedSpans()
      .flatMap((s) => s.events.map((e) => e.name));
    expect(secondRunEvents).toContain("cache.hit");
    expect(secondRunEvents).not.toContain("cache.miss");
  });

  it("sets summary attributes on pipeline span", async () => {
    const pipeline = definePipeline({
      id: "summary-attrs",
      name: "Summary Attrs",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt"), createMockFile("Blocks.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
        "ucd/Blocks.txt": "0000..007F;Basic Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (_ctx, rows) => {
            for await (const _ of rows) { /* consume */ }
            return [];
          },
        }),
      ],
    });

    await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    const pipelineSpan = otel.exporter.getFinishedSpans().find((s) => s.name === "pipeline");
    expect(pipelineSpan).toBeDefined();
    expect(pipelineSpan?.attributes["summary.total.files"]).toBe(2);
    expect(pipelineSpan?.attributes["summary.matched.files"]).toBe(1);
  });

  it("emits file.skipped event for unmatched file with no fallback", async () => {
    const pipeline = definePipeline({
      id: "skipped-span",
      name: "Skipped Span",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt"), createMockFile("Blocks.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
        "ucd/Blocks.txt": "0000..007F;Basic Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (_ctx, rows) => {
            for await (const _ of rows) { /* consume */ }
            return [];
          },
        }),
      ],
    });

    await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    const versionSpan = otel.exporter.getFinishedSpans().find((s) => s.name === "version");
    const skippedEvent = versionSpan?.events.find((e) => e.name === "file.skipped");
    expect(skippedEvent).toBeDefined();
    expect(skippedEvent?.attributes?.["skipped.reason"]).toBe("no-match");
  });

  it("emits file.fallback event when fallback route handles unmatched file", async () => {
    const pipeline = definePipeline({
      id: "fallback-span",
      name: "Fallback Span",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Unknown.txt")], {
        "ucd/Unknown.txt": "0041;Latin",
      })],
      routes: [],
      fallback: {
        parser: mockParser,
        resolver: async (_ctx, rows) => {
          for await (const _ of rows) { /* consume */ }
          return [];
        },
      },
    });

    await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    const routeSpan = otel.exporter.getFinishedSpans().find((s) => s.name === "file.route");
    expect(routeSpan).toBeDefined();
    const eventNames = routeSpan?.events.map((e) => e.name) ?? [];
    expect(eventNames).toContain("file.fallback");
  });

  it("emits file.queued and file.dequeued events on version span", async () => {
    const pipeline = definePipeline({
      id: "queue-span",
      name: "Queue Span",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (_ctx, rows) => {
            for await (const _ of rows) { /* consume */ }
            return [];
          },
        }),
      ],
    });

    await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    const versionSpan = otel.exporter.getFinishedSpans().find((s) => s.name === "version");
    const eventNames = versionSpan?.events.map((e) => e.name) ?? [];
    expect(eventNames).toContain("file.queued");
    expect(eventNames).toContain("file.dequeued");
  });

  it("emits one version span per pipeline version", async () => {
    const pipeline = definePipeline({
      id: "multi-version",
      name: "Multi Version",
      versions: ["15.0.0", "16.0.0"],
      inputs: [createTestSource(
        [createMockFile("Scripts.txt"), { ...createMockFile("Scripts.txt"), version: "15.0.0" }],
        { "ucd/Scripts.txt": "0041;Latin" },
      )],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (_ctx, rows) => {
            for await (const _ of rows) { /* consume */ }
            return [];
          },
        }),
      ],
    });

    await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    const versionSpans = otel.exporter.getFinishedSpans().filter((s) => s.name === "version");
    expect(versionSpans).toHaveLength(2);
    const versions = versionSpans.map((s) => s.attributes["pipeline.version"]);
    expect(versions).toContain("15.0.0");
    expect(versions).toContain("16.0.0");
  });

  it("sets ERROR status and records exception event when route throws", async () => {
    const pipeline = definePipeline({
      id: "error-span",
      name: "Error Span",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async () => {
            throw new Error("route exploded");
          },
        }),
      ],
    });

    await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    const routeSpan = otel.exporter.getFinishedSpans().find((s) => s.name === "file.route");
    expect(routeSpan).toBeDefined();
    expect(routeSpan?.status.code).toBe(SpanStatusCode.ERROR);
    const eventNames = routeSpan?.events.map((e) => e.name) ?? [];
    expect(eventNames).toContain("exception");
  });
});

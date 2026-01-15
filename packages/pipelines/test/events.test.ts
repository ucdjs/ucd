import type { FileContext, ParseContext, ParsedRow, PropertyJson } from "../src/types";
import type {
  ArtifactEndEvent,
  ArtifactStartEvent,
  FileMatchedEvent,
  FileSkippedEvent,
  ParseEndEvent,
  ParseStartEvent,
  PipelineEndEvent,
  PipelineError,
  PipelineErrorEvent,
  PipelineEvent,
  PipelineGraph,
  PipelineGraphEdge,
  PipelineGraphNode,
  PipelineStartEvent,
  ResolveEndEvent,
  ResolveStartEvent,
  VersionEndEvent,
  VersionStartEvent,
} from "../src/events";
import { describe, expect, expectTypeOf, it } from "vitest";
import { byName } from "../src/filters";
import { definePipeline } from "../src/pipeline";
import { definePipelineArtifact } from "../src/artifact";
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

describe("PipelineEvent types", () => {
  it("should have correct PipelineStartEvent structure", () => {
    const event: PipelineStartEvent = {
      type: "pipeline:start",
      versions: ["16.0.0"],
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"pipeline:start">();
    expectTypeOf(event.versions).toEqualTypeOf<string[]>();
    expectTypeOf(event.timestamp).toEqualTypeOf<number>();
  });

  it("should have correct PipelineEndEvent structure", () => {
    const event: PipelineEndEvent = {
      type: "pipeline:end",
      durationMs: 100,
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"pipeline:end">();
    expectTypeOf(event.durationMs).toEqualTypeOf<number>();
    expectTypeOf(event.timestamp).toEqualTypeOf<number>();
  });

  it("should have correct VersionStartEvent structure", () => {
    const event: VersionStartEvent = {
      type: "version:start",
      version: "16.0.0",
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"version:start">();
    expectTypeOf(event.version).toEqualTypeOf<string>();
  });

  it("should have correct VersionEndEvent structure", () => {
    const event: VersionEndEvent = {
      type: "version:end",
      version: "16.0.0",
      durationMs: 100,
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"version:end">();
    expectTypeOf(event.durationMs).toEqualTypeOf<number>();
  });

  it("should have correct ArtifactStartEvent structure", () => {
    const event: ArtifactStartEvent = {
      type: "artifact:start",
      artifactId: "names",
      version: "16.0.0",
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"artifact:start">();
    expectTypeOf(event.artifactId).toEqualTypeOf<string>();
    expectTypeOf(event.version).toEqualTypeOf<string>();
  });

  it("should have correct ArtifactEndEvent structure", () => {
    const event: ArtifactEndEvent = {
      type: "artifact:end",
      artifactId: "names",
      version: "16.0.0",
      durationMs: 50,
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"artifact:end">();
    expectTypeOf(event.durationMs).toEqualTypeOf<number>();
  });

  it("should have correct FileMatchedEvent structure", () => {
    const file: FileContext = {
      path: "LineBreak.txt",
      name: "LineBreak.txt",
      dir: "",
      ext: ".txt",
      version: "16.0.0",
    };

    const event: FileMatchedEvent = {
      type: "file:matched",
      file,
      routeId: "line-break",
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"file:matched">();
    expectTypeOf(event.file).toEqualTypeOf<FileContext>();
    expectTypeOf(event.routeId).toEqualTypeOf<string>();
  });

  it("should have correct FileSkippedEvent structure", () => {
    const file: FileContext = {
      path: "Unknown.txt",
      name: "Unknown.txt",
      dir: "",
      ext: ".txt",
      version: "16.0.0",
    };

    const event: FileSkippedEvent = {
      type: "file:skipped",
      file,
      reason: "no-match",
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"file:skipped">();
    expectTypeOf(event.reason).toEqualTypeOf<"no-match" | "filtered">();
  });

  it("should have correct ParseStartEvent structure", () => {
    const file: FileContext = {
      path: "test.txt",
      name: "test.txt",
      dir: "",
      ext: ".txt",
      version: "16.0.0",
    };

    const event: ParseStartEvent = {
      type: "parse:start",
      file,
      routeId: "test-route",
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"parse:start">();
    expectTypeOf(event.file).toEqualTypeOf<FileContext>();
    expectTypeOf(event.routeId).toEqualTypeOf<string>();
  });

  it("should have correct ParseEndEvent structure", () => {
    const file: FileContext = {
      path: "test.txt",
      name: "test.txt",
      dir: "",
      ext: ".txt",
      version: "16.0.0",
    };

    const event: ParseEndEvent = {
      type: "parse:end",
      file,
      routeId: "test-route",
      rowCount: 100,
      durationMs: 25,
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"parse:end">();
    expectTypeOf(event.rowCount).toEqualTypeOf<number>();
    expectTypeOf(event.durationMs).toEqualTypeOf<number>();
  });

  it("should have correct ResolveStartEvent structure", () => {
    const file: FileContext = {
      path: "test.txt",
      name: "test.txt",
      dir: "",
      ext: ".txt",
      version: "16.0.0",
    };

    const event: ResolveStartEvent = {
      type: "resolve:start",
      file,
      routeId: "test-route",
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"resolve:start">();
  });

  it("should have correct ResolveEndEvent structure", () => {
    const file: FileContext = {
      path: "test.txt",
      name: "test.txt",
      dir: "",
      ext: ".txt",
      version: "16.0.0",
    };

    const event: ResolveEndEvent = {
      type: "resolve:end",
      file,
      routeId: "test-route",
      outputCount: 5,
      durationMs: 10,
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"resolve:end">();
    expectTypeOf(event.outputCount).toEqualTypeOf<number>();
  });

  it("should have correct PipelineErrorEvent structure", () => {
    const error: PipelineError = {
      scope: "route",
      message: "Something went wrong",
      routeId: "test-route",
      version: "16.0.0",
    };

    const event: PipelineErrorEvent = {
      type: "error",
      error,
      timestamp: Date.now(),
    };

    expectTypeOf(event.type).toEqualTypeOf<"error">();
    expectTypeOf(event.error).toEqualTypeOf<PipelineError>();
  });
});

describe("PipelineError", () => {
  it("should support all error scopes", () => {
    const scopes: PipelineError["scope"][] = [
      "pipeline",
      "version",
      "file",
      "route",
      "artifact",
    ];

    expect(scopes).toHaveLength(5);
  });

  it("should have optional file context", () => {
    const errorWithFile: PipelineError = {
      scope: "file",
      message: "File error",
      file: {
        path: "test.txt",
        name: "test.txt",
        dir: "",
        ext: ".txt",
        version: "16.0.0",
      },
    };

    const errorWithoutFile: PipelineError = {
      scope: "pipeline",
      message: "Pipeline error",
    };

    expect(errorWithFile.file).toBeDefined();
    expect(errorWithoutFile.file).toBeUndefined();
  });

  it("should have optional routeId", () => {
    const error: PipelineError = {
      scope: "route",
      message: "Route error",
      routeId: "test-route",
    };

    expectTypeOf(error.routeId).toEqualTypeOf<string | undefined>();
  });

  it("should have optional artifactId", () => {
    const error: PipelineError = {
      scope: "artifact",
      message: "Artifact error",
      artifactId: "names",
    };

    expectTypeOf(error.artifactId).toEqualTypeOf<string | undefined>();
  });
});

describe("PipelineGraph", () => {
  it("should have nodes and edges", () => {
    const graph: PipelineGraph = {
      nodes: [],
      edges: [],
    };

    expectTypeOf(graph.nodes).toEqualTypeOf<PipelineGraphNode[]>();
    expectTypeOf(graph.edges).toEqualTypeOf<PipelineGraphEdge[]>();
  });

  it("should support source node type", () => {
    const node: PipelineGraphNode = {
      id: "source:16.0.0",
      type: "source",
      version: "16.0.0",
    };

    expect(node.type).toBe("source");
    expect(node.version).toBe("16.0.0");
  });

  it("should support file node type", () => {
    const file: FileContext = {
      path: "test.txt",
      name: "test.txt",
      dir: "",
      ext: ".txt",
      version: "16.0.0",
    };

    const node: PipelineGraphNode = {
      id: "file:16.0.0:test.txt",
      type: "file",
      file,
    };

    expect(node.type).toBe("file");
    expect(node.file).toEqual(file);
  });

  it("should support route node type", () => {
    const node: PipelineGraphNode = {
      id: "route:16.0.0:line-break",
      type: "route",
      routeId: "line-break",
    };

    expect(node.type).toBe("route");
    expect(node.routeId).toBe("line-break");
  });

  it("should support artifact node type", () => {
    const node: PipelineGraphNode = {
      id: "artifact:16.0.0:names",
      type: "artifact",
      artifactId: "names",
    };

    expect(node.type).toBe("artifact");
    expect(node.artifactId).toBe("names");
  });

  it("should support output node type with optional property", () => {
    const nodeWithProperty: PipelineGraphNode = {
      id: "output:16.0.0:0",
      type: "output",
      outputIndex: 0,
      property: "Line_Break",
    };

    const nodeWithoutProperty: PipelineGraphNode = {
      id: "output:16.0.0:1",
      type: "output",
      outputIndex: 1,
    };

    expect(nodeWithProperty.property).toBe("Line_Break");
    expect(nodeWithoutProperty.property).toBeUndefined();
  });

  it("should support all edge types", () => {
    const edgeTypes: PipelineGraphEdge["type"][] = [
      "provides",
      "matched",
      "parsed",
      "resolved",
      "uses-artifact",
    ];

    expect(edgeTypes).toHaveLength(5);
  });

  it("should have from and to on edges", () => {
    const edge: PipelineGraphEdge = {
      from: "source:16.0.0",
      to: "file:16.0.0:test.txt",
      type: "provides",
    };

    expectTypeOf(edge.from).toEqualTypeOf<string>();
    expectTypeOf(edge.to).toEqualTypeOf<string>();
    expectTypeOf(edge.type).toEqualTypeOf<"provides" | "matched" | "parsed" | "resolved" | "uses-artifact">();
  });
});

describe("Event emission during pipeline run", () => {
  it("should emit pipeline:start and pipeline:end events", async () => {
    const events: PipelineEvent[] = [];

    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      routes: [route],
      onEvent: (event) => { events.push(event); },
    });

    await pipeline.run();

    const startEvent = events.find((e) => e.type === "pipeline:start");
    const endEvent = events.find((e) => e.type === "pipeline:end");

    expect(startEvent).toBeDefined();
    expect(endEvent).toBeDefined();
    expect(startEvent?.type).toBe("pipeline:start");
    expect(endEvent?.type).toBe("pipeline:end");
  });

  it("should emit version:start and version:end for each version", async () => {
    const events: PipelineEvent[] = [];

    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0", "15.1.0"],
      source: createMockSource({
        "16.0.0": { "test.txt": "content" },
        "15.1.0": { "test.txt": "content" },
      }),
      routes: [route],
      onEvent: (event) => { events.push(event); },
    });

    await pipeline.run();

    const versionStarts = events.filter((e) => e.type === "version:start");
    const versionEnds = events.filter((e) => e.type === "version:end");

    expect(versionStarts).toHaveLength(2);
    expect(versionEnds).toHaveLength(2);
  });

  it("should emit artifact events when artifacts are defined", async () => {
    const events: PipelineEvent[] = [];

    const artifact = definePipelineArtifact({
      id: "names",
      build: async () => new Map([["0041", "LATIN CAPITAL LETTER A"]]),
    });

    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      artifacts: [artifact],
      routes: [route],
      onEvent: (event) => { events.push(event); },
    });

    await pipeline.run();

    const artifactStart = events.find((e) => e.type === "artifact:start");
    const artifactEnd = events.find((e) => e.type === "artifact:end");

    expect(artifactStart).toBeDefined();
    expect(artifactEnd).toBeDefined();
    if (artifactStart?.type === "artifact:start") {
      expect(artifactStart.artifactId).toBe("names");
    }
  });

  it("should emit file:matched for matched files", async () => {
    const events: PipelineEvent[] = [];

    const route = definePipelineRoute({
      id: "test",
      filter: byName("matched.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({
        "16.0.0": {
          "matched.txt": "content",
          "unmatched.txt": "content",
        },
      }),
      routes: [route],
      onEvent: (event) => { events.push(event); },
    });

    await pipeline.run();

    const matchedEvents = events.filter((e) => e.type === "file:matched");
    expect(matchedEvents).toHaveLength(1);

    if (matchedEvents[0]?.type === "file:matched") {
      expect(matchedEvents[0].file.name).toBe("matched.txt");
      expect(matchedEvents[0].routeId).toBe("test");
    }
  });

  it("should emit file:skipped for unmatched files", async () => {
    const events: PipelineEvent[] = [];

    const route = definePipelineRoute({
      id: "test",
      filter: byName("matched.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({
        "16.0.0": {
          "matched.txt": "content",
          "unmatched.txt": "content",
        },
      }),
      routes: [route],
      onEvent: (event) => { events.push(event); },
    });

    await pipeline.run();

    const skippedEvents = events.filter((e) => e.type === "file:skipped");
    expect(skippedEvents).toHaveLength(1);

    if (skippedEvents[0]?.type === "file:skipped") {
      expect(skippedEvents[0].file.name).toBe("unmatched.txt");
      expect(skippedEvents[0].reason).toBe("no-match");
    }
  });

  it("should emit parse and resolve events", async () => {
    const events: PipelineEvent[] = [];

    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      routes: [route],
      onEvent: (event) => { events.push(event); },
    });

    await pipeline.run();

    const parseStart = events.find((e) => e.type === "parse:start");
    const parseEnd = events.find((e) => e.type === "parse:end");
    const resolveStart = events.find((e) => e.type === "resolve:start");
    const resolveEnd = events.find((e) => e.type === "resolve:end");

    expect(parseStart).toBeDefined();
    expect(parseEnd).toBeDefined();
    expect(resolveStart).toBeDefined();
    expect(resolveEnd).toBeDefined();
  });

  it("should emit error events on failures", async () => {
    const events: PipelineEvent[] = [];

    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (): Promise<PropertyJson[]> => {
        throw new Error("Resolver failed");
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      routes: [route],
      onEvent: (event) => { events.push(event); },
    });

    await pipeline.run();

    const errorEvent = events.find((e) => e.type === "error");
    expect(errorEvent).toBeDefined();

    if (errorEvent?.type === "error") {
      expect(errorEvent.error.message).toBe("Resolver failed");
      expect(errorEvent.error.scope).toBe("route");
    }
  });
});

describe("Graph construction", () => {
  it("should build graph with source nodes", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      routes: [route],
    });

    const result = await pipeline.run();

    const sourceNodes = result.graph.nodes.filter((n) => n.type === "source");
    expect(sourceNodes).toHaveLength(1);
    expect(sourceNodes[0]?.type === "source" && sourceNodes[0].version).toBe("16.0.0");
  });

  it("should build graph with file nodes", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      routes: [route],
    });

    const result = await pipeline.run();

    const fileNodes = result.graph.nodes.filter((n) => n.type === "file");
    expect(fileNodes).toHaveLength(1);
    expect(fileNodes[0]?.type === "file" && fileNodes[0].file.name).toBe("test.txt");
  });

  it("should build graph with route nodes", async () => {
    const route = definePipelineRoute({
      id: "line-break",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      routes: [route],
    });

    const result = await pipeline.run();

    const routeNodes = result.graph.nodes.filter((n) => n.type === "route");
    expect(routeNodes).toHaveLength(1);
    expect(routeNodes[0]?.type === "route" && routeNodes[0].routeId).toBe("line-break");
  });

  it("should build graph with output nodes", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      routes: [route],
    });

    const result = await pipeline.run();

    const outputNodes = result.graph.nodes.filter((n) => n.type === "output");
    expect(outputNodes).toHaveLength(1);
  });

  it("should create edges between nodes", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      source: createMockSource({ "16.0.0": { "test.txt": "content" } }),
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.graph.edges.length).toBeGreaterThan(0);

    const providesEdges = result.graph.edges.filter((e) => e.type === "provides");
    const matchedEdges = result.graph.edges.filter((e) => e.type === "matched");
    const resolvedEdges = result.graph.edges.filter((e) => e.type === "resolved");

    expect(providesEdges.length).toBeGreaterThan(0);
    expect(matchedEdges.length).toBeGreaterThan(0);
    expect(resolvedEdges.length).toBeGreaterThan(0);
  });
});

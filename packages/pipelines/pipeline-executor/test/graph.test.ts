import type { PipelineTraceRecord } from "@ucdjs/pipelines-core/tracing";
import { describe, expect, it } from "vitest";
import { buildExecutionGraphFromTraces } from "../src/graph";

describe("buildExecutionGraphFromTraces", () => {
  it("creates distinct output nodes for traced output destinations", () => {
    const traces: PipelineTraceRecord[] = [
      {
        id: "trace-1",
        kind: "output.produced",
        pipelineId: "demo",
        timestamp: Date.now(),
        version: "1.0.0",
        routeId: "colors",
        outputIndex: 0,
        property: "Colors",
        traceId: "trace-1",
      },
      {
        id: "trace-2",
        kind: "output",
        pipelineId: "demo",
        timestamp: Date.now(),
        version: "1.0.0",
        routeId: "colors",
        file: {
          version: "1.0.0",
          dir: "ucd",
          path: "ucd/colors.txt",
          name: "colors.txt",
          ext: ".txt",
        },
        outputIndex: 0,
        outputId: "memory-preview",
        property: "Colors",
        sink: "memory",
        format: "json",
        locator: "memory://preview/1.0.0/colors.json",
        traceId: "trace-2",
      },
      {
        id: "trace-3",
        kind: "output",
        pipelineId: "demo",
        timestamp: Date.now(),
        version: "1.0.0",
        routeId: "colors",
        file: {
          version: "1.0.0",
          dir: "ucd",
          path: "ucd/colors.txt",
          name: "colors.txt",
          ext: ".txt",
        },
        outputIndex: 0,
        outputId: "filesystem-archive",
        property: "Colors",
        sink: "filesystem",
        format: "json",
        locator: "/tmp/archive/colors.json",
        traceId: "trace-3",
      },
    ];

    const graph = buildExecutionGraphFromTraces(traces);
    const outputNodes = graph.nodes.filter((node) => node.type === "output");

    expect(outputNodes).toHaveLength(2);
    expect(outputNodes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        outputId: "memory-preview",
        locator: "memory://preview/1.0.0/colors.json",
      }),
      expect.objectContaining({
        outputId: "filesystem-archive",
        locator: "/tmp/archive/colors.json",
      }),
    ]));
  });

  it("creates an output node for a produced output with no resolved sink", () => {
    const traces: PipelineTraceRecord[] = [
      {
        id: "trace-1",
        kind: "output.produced",
        pipelineId: "demo",
        timestamp: Date.now(),
        version: "1.0.0",
        routeId: "colors",
        outputIndex: 0,
        property: "Colors",
        traceId: "trace-1",
      },
    ];

    const graph = buildExecutionGraphFromTraces(traces);
    const outputNodes = graph.nodes.filter((node) => node.type === "output");

    expect(outputNodes).toHaveLength(1);
    expect(outputNodes[0]).toEqual(expect.objectContaining({
      type: "output",
      outputIndex: 0,
      property: "Colors",
    }));
    expect(graph.edges.some((e) => e.type === "resolved")).toBe(true);
  });
});

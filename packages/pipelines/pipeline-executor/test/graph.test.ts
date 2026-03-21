import type { PipelineTraceRecord } from "../src/run/traces";
import { describe, expect, it } from "vitest";
import { buildExecutionGraphFromTraces } from "../src/run/graph";

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
      },
      {
        id: "trace-2",
        kind: "output.resolved",
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
      },
      {
        id: "trace-3",
        kind: "output.resolved",
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
});

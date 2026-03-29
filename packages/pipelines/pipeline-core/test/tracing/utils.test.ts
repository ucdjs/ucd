import type { PipelineTraceRecord } from "../../src/tracing/types";
import { describe, expect, it } from "vitest";
import { buildOutputManifestFromTraces, getTracePhase } from "../../src/tracing/utils";

describe("getTracePhase", () => {
  it.each([
    ["pipeline", "Pipeline"],
    ["version", "Version"],
    ["parse", "Parse"],
    ["resolve", "Resolve"],
    ["file.matched", "File"],
    ["cache.hit", "Cache"],
    ["error", "Error"],
  ])("maps trace kind '%s' to phase '%s'", (kind, expectedPhase) => {
    expect(getTracePhase(kind)).toBe(expectedPhase);
  });
});

describe("buildOutputManifestFromTraces", () => {
  it("upgrades resolved outputs to failed or written manifest entries by locator key", () => {
    const traces: PipelineTraceRecord[] = [
      {
        id: "trace-1",
        kind: "output",
        pipelineId: "demo",
        timestamp: 1,
        version: "16.0.0",
        routeId: "scripts",
        file: {
          version: "16.0.0",
          dir: "ucd",
          path: "ucd/Scripts.txt",
          name: "Scripts.txt",
          ext: ".txt",
        },
        outputIndex: 0,
        outputId: "json",
        property: "Script",
        sink: "filesystem",
        format: "json",
        locator: "/tmp/script.json",
        traceId: "trace-1",
      },
      {
        id: "trace-2",
        kind: "output.written",
        pipelineId: "demo",
        timestamp: 2,
        version: "16.0.0",
        routeId: "scripts",
        file: {
          version: "16.0.0",
          dir: "ucd",
          path: "ucd/Scripts.txt",
          name: "Scripts.txt",
          ext: ".txt",
        },
        outputIndex: 0,
        outputId: "json",
        property: "Script",
        sink: "filesystem",
        locator: "/tmp/script.json",
        status: "failed",
        error: "disk full",
        traceId: "trace-2",
      },
      {
        id: "trace-3",
        kind: "output",
        pipelineId: "demo",
        timestamp: 3,
        version: "16.0.0",
        routeId: "scripts",
        file: {
          version: "16.0.0",
          dir: "ucd",
          path: "ucd/Scripts.txt",
          name: "Scripts.txt",
          ext: ".txt",
        },
        outputIndex: 1,
        outputId: "preview",
        property: "Script",
        sink: "memory",
        format: "json",
        locator: "memory://preview/script.json",
        traceId: "trace-3",
      },
      {
        id: "trace-4",
        kind: "output.written",
        pipelineId: "demo",
        timestamp: 4,
        version: "16.0.0",
        routeId: "scripts",
        file: {
          version: "16.0.0",
          dir: "ucd",
          path: "ucd/Scripts.txt",
          name: "Scripts.txt",
          ext: ".txt",
        },
        outputIndex: 1,
        outputId: "preview",
        property: "Script",
        sink: "memory",
        locator: "memory://preview/script.json",
        status: "written",
        traceId: "trace-4",
      },
    ];

    expect(buildOutputManifestFromTraces(traces)).toEqual([
      expect.objectContaining({
        outputId: "json",
        status: "failed",
        error: "disk full",
      }),
      expect.objectContaining({
        outputId: "preview",
        status: "written",
      }),
    ]);
  });
});

import type { FileContext } from "@ucdjs/pipelines-core";
import type { PipelineTraceRecord } from "../src/run/traces";
import { definePipeline } from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import { createPipelineExecutor } from "../src/executor";
import { createMockFile, createTestRoute, createTestSource } from "./helpers";

describe("executor traces", () => {
  it("should emit pipeline and version traces", async () => {
    const traces: PipelineTraceRecord[] = [];
    const files: FileContext[] = [createMockFile("Test.txt")];
    const contents = { "ucd/Test.txt": "0041;A" };

    const pipeline = definePipeline({
      id: "traces",
      name: "Traces",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("route", () => true)],
    });

    const executor = createPipelineExecutor({
      onTrace: (trace) => {
        traces.push(trace);
      },
    });

    await executor.run([pipeline]);

    expect(traces.some((trace) => trace.kind === "pipeline.start")).toBe(true);
    expect(traces.some((trace) => trace.kind === "pipeline.end")).toBe(true);
    expect(traces.some((trace) => trace.kind === "version.start")).toBe(true);
    expect(traces.some((trace) => trace.kind === "version.end")).toBe(true);
  });
});

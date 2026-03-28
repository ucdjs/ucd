import type { FileContext } from "@ucdjs/pipelines-core";
import type { PipelineTraceRecord } from "@ucdjs/pipelines-core/tracing";
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

    expect(traces.some((trace) => trace.kind === "pipeline")).toBe(true);
    expect(traces.some((trace) => trace.kind === "version")).toBe(true);
    expect(traces.some((trace) => trace.kind === "source.listing")).toBe(true);
  });
});

import type { PipelineExecutionResult } from "../src";
import { definePipeline, pipelineOutputSource } from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import { createSourceAdapter } from "../src/run/source-files";
import { createMockFile, createTestSource } from "./helpers";

const logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

describe("source adapter", () => {
  it("lists and reads published pipeline outputs from prior results", async () => {
    const pipeline = definePipeline({
      id: "consumer",
      name: "Consumer",
      versions: ["16.0.0"],
      inputs: [pipelineOutputSource({ pipelineId: "upstream", outputId: "json" })],
      routes: [],
    });

    const priorResults: PipelineExecutionResult[] = [{
      id: "upstream",
      data: [{ hello: "world" }],
      outputManifest: [{
        outputIndex: 0,
        outputId: "json",
        routeId: "scripts",
        pipelineId: "upstream",
        version: "16.0.0",
        sink: "memory",
        format: "json",
        locator: "memory://published/script.json",
        status: "written",
      }],
      traces: [],
      graph: { nodes: [], edges: [] },
      errors: [],
      summary: {
        versions: ["16.0.0"],
        totalRoutes: 1,
        cached: 0,
        totalFiles: 1,
        matchedFiles: 1,
        skippedFiles: 0,
        fallbackFiles: 0,
        totalOutputs: 1,
        durationMs: 1,
      },
      status: "completed",
    }];

    const adapter = createSourceAdapter(pipeline, logger, { priorResults });
    const files = await adapter.listFiles("16.0.0");

    expect(files).toEqual([
      expect.objectContaining({
        path: "pipeline-output/upstream/json/script.json",
        name: "script.json",
      }),
    ]);
    await expect(adapter.readFile(files[0]!)).resolves.toContain("\"hello\": \"world\"");
  });

  it("falls back to the configured backend for source files", async () => {
    const file = createMockFile("Scripts.txt");
    const pipeline = definePipeline({
      id: "consumer",
      name: "Consumer",
      versions: ["16.0.0"],
      inputs: [createTestSource([file], { [file.path]: "0041;Latin" })],
      routes: [],
    });

    const adapter = createSourceAdapter(pipeline, logger);
    const files = await adapter.listFiles("16.0.0");

    expect(files).toEqual([
      expect.objectContaining(file),
    ]);
    await expect(adapter.readFile(files[0]!)).resolves.toBe("0041;Latin");
  });
});

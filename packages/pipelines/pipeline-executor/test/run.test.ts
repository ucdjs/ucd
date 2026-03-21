import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import { createPipelineExecutor } from "../src/executor";
import {
  buildRouteOutputs,
  buildRoutesByLayer,
  createSummary,
  resolveVersions,
} from "../src/run/setup";
import { createMockFile, createTestSource, mockParser } from "./helpers";

describe("run helpers", () => {
  it("resolves versions from run options before pipeline defaults", () => {
    const pipeline = definePipeline({
      id: "versions",
      name: "Versions",
      versions: ["16.0.0", "17.0.0"],
      inputs: [createTestSource([])],
      routes: [],
    });

    expect(resolveVersions(pipeline)).toEqual(["16.0.0", "17.0.0"]);
    expect(resolveVersions(pipeline, { versions: ["17.0.0"] })).toEqual(["17.0.0"]);
  });

  it("builds route layers from pipeline dependencies", () => {
    const colors = definePipelineRoute({
      id: "colors",
      filter: byName("Colors.txt"),
      parser: mockParser,
      resolver: async () => [],
    });
    const grouped = definePipelineRoute({
      id: "grouped",
      depends: ["route:colors"],
      filter: byName("Colors.txt"),
      parser: mockParser,
      resolver: async () => [],
    });

    const pipeline = definePipeline({
      id: "layers",
      name: "Layers",
      versions: ["16.0.0"],
      inputs: [createTestSource([])],
      routes: [colors, grouped],
    });

    expect(buildRoutesByLayer(pipeline).map((layer) => layer.map((route) => route.id))).toEqual([
      ["colors"],
      ["grouped"],
    ]);
  });

  it("normalizes route output definitions and creates zeroed summaries", () => {
    const route = definePipelineRoute({
      id: "scripts",
      filter: byName("Scripts.txt"),
      async* parser() {},
      resolver: async () => [],
      outputs: [{
        id: "json",
        path: "out/{version}.json",
      }],
    });

    const pipeline = definePipeline({
      id: "outputs",
      name: "Outputs",
      versions: ["16.0.0"],
      inputs: [createTestSource([])],
      routes: [route],
    });

    expect(buildRouteOutputs(pipeline).get("scripts")).toEqual([
      expect.objectContaining({
        id: "json",
        path: "out/{version}.json",
      }),
    ]);
    expect(createSummary(["16.0.0"])).toEqual({
      versions: ["16.0.0"],
      totalRoutes: 0,
      cached: 0,
      totalFiles: 0,
      matchedFiles: 0,
      skippedFiles: 0,
      fallbackFiles: 0,
      totalOutputs: 0,
      durationMs: 0,
    });
  });
});

describe("getRouteData", () => {
  it("allows downstream route to read upstream route outputs", async () => {
    const files = [createMockFile("Colors.txt"), createMockFile("Sizes.txt")];
    const contents = {
      "ucd/Colors.txt": "0041;Red",
      "ucd/Sizes.txt": "0042;Large",
    };

    const colorsRoute = definePipelineRoute({
      id: "colors",
      filter: byName("Colors.txt"),
      parser: mockParser,
      resolver: async (ctx, rows) => {
        const entries = [];
        for await (const row of rows) {
          entries.push({ codePoint: row.codePoint!, value: row.value as string });
        }
        return [{ version: ctx.version, property: "Colors", file: ctx.file.name, entries }];
      },
    });

    const sizesRoute = definePipelineRoute({
      id: "sizes",
      filter: byName("Sizes.txt"),
      depends: ["route:colors"],
      parser: mockParser,
      resolver: async (ctx, rows) => {
        const colorData = ctx.getRouteData("colors");
        const entries = [];
        for await (const row of rows) {
          entries.push({ codePoint: row.codePoint!, value: row.value as string });
        }
        return [{
          version: ctx.version,
          property: "Sizes",
          file: ctx.file.name,
          entries,
          meta: { colorCount: colorData.length },
        }];
      },
    });

    const pipeline = definePipeline({
      id: "route-data-test",
      name: "Route Data Test",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [colorsRoute, sizesRoute],
    });

    const executor = createPipelineExecutor({});
    const [result] = await executor.run([pipeline]);

    const sizesOutput = result?.data.find((d: any) => d.property === "Sizes") as any;
    expect(sizesOutput).toBeDefined();
    expect(sizesOutput.meta.colorCount).toBe(1);
  });

  it("throws for unknown route in getRouteData", async () => {
    const files = [createMockFile("Test.txt")];
    const contents = { "ucd/Test.txt": "0041;A" };

    const route = definePipelineRoute({
      id: "test",
      filter: byName("Test.txt"),
      parser: mockParser,
      resolver: async (ctx) => {
        ctx.getRouteData("nonexistent");
        return [];
      },
    });

    const pipeline = definePipeline({
      id: "error-test",
      name: "Error Test",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [route],
    });

    const executor = createPipelineExecutor({});
    const [result] = await executor.run([pipeline]);

    expect(result?.errors.length).toBeGreaterThan(0);
    expect(result?.errors[0]?.message).toContain("nonexistent");
  });

  it("accumulates outputs from multiple files for the same route", async () => {
    const files = [createMockFile("A.txt"), createMockFile("B.txt"), createMockFile("Summary.txt")];
    const contents = {
      "ucd/A.txt": "0041;Alpha",
      "ucd/B.txt": "0042;Beta",
      "ucd/Summary.txt": "0043;Gamma",
    };

    const dataRoute = definePipelineRoute({
      id: "data",
      filter: (ctx) => ctx.file.name === "A.txt" || ctx.file.name === "B.txt",
      parser: mockParser,
      resolver: async (ctx, rows) => {
        const entries = [];
        for await (const row of rows) {
          entries.push({ codePoint: row.codePoint!, value: row.value as string });
        }
        return [{ version: ctx.version, property: "Data", file: ctx.file.name, entries }];
      },
    });

    const summaryRoute = definePipelineRoute({
      id: "summary",
      filter: byName("Summary.txt"),
      depends: ["route:data"],
      parser: mockParser,
      resolver: async (ctx, rows) => {
        const priorData = ctx.getRouteData("data");
        const entries = [];
        for await (const row of rows) {
          entries.push({ codePoint: row.codePoint!, value: row.value as string });
        }
        return [{
          version: ctx.version,
          property: "Summary",
          file: ctx.file.name,
          entries,
          meta: { priorOutputCount: priorData.length },
        }];
      },
    });

    const pipeline = definePipeline({
      id: "multi-file-test",
      name: "Multi-File Test",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [dataRoute, summaryRoute],
    });

    const executor = createPipelineExecutor({});
    const [result] = await executor.run([pipeline]);

    const summaryOutput = result?.data.find((d: any) => d.property === "Summary") as any;
    expect(summaryOutput).toBeDefined();
    expect(summaryOutput.meta.priorOutputCount).toBe(2);
  });
});

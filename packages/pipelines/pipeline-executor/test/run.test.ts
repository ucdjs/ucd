import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import {
  buildRouteOutputs,
  buildRoutesByLayer,
  createSummary,
  resolveVersions,
} from "../src/run/setup";
import { createTestSource, mockParser } from "./helpers";

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

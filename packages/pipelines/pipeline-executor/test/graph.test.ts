import { definePipeline } from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import { createPipelineExecutor } from "../src/executor";
import { createMockFile, createTestRoute, createTestSource } from "./helpers";

describe("executor graph", () => {
  it("should build edges across multiple routes", async () => {
    const files = [createMockFile("LineBreak.txt"), createMockFile("Scripts.txt")];
    const contents = {
      "ucd/LineBreak.txt": "0041;AL",
      "ucd/Scripts.txt": "0041;Latin",
    };

    const pipeline = definePipeline({
      id: "graph-multi",
      name: "Graph Multi",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [
        createTestRoute("line-break", (ctx) => ctx.file.name === "LineBreak.txt"),
        createTestRoute("scripts", (ctx) => ctx.file.name === "Scripts.txt"),
      ],
    });

    const executor = createPipelineExecutor({});
    const results = await executor.run([pipeline]);
    const result = results.find((item) => item.id === "graph-multi")!;

    const sourceNodes = result.graph.nodes.filter((node) => node.type === "source");
    const fileNodes = result.graph.nodes.filter((node) => node.type === "file");
    const routeNodes = result.graph.nodes.filter((node) => node.type === "route");
    const outputNodes = result.graph.nodes.filter((node) => node.type === "output");

    expect(sourceNodes.length).toBe(1);
    expect(fileNodes.length).toBe(2);
    expect(routeNodes.length).toBe(2);
    expect(outputNodes.length).toBe(2);
    expect(result.graph.edges.length).toBeGreaterThan(0);
  });
});

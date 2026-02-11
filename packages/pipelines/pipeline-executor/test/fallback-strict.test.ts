import type { FallbackRouteDefinition } from "@ucdjs/pipelines-core";
import { definePipeline } from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import { createPipelineExecutor } from "../src/executor";
import { createMockFile, createTestRoute, createTestSource, mockParser } from "./helpers";

describe("executor strict and fallback", () => {
  it("should use fallback for unmatched files", async () => {
    const files = [createMockFile("Matched.txt"), createMockFile("Fallback.txt")];
    const contents = {
      "ucd/Matched.txt": "0041;A",
      "ucd/Fallback.txt": "0042;B",
    };

    const fallback: FallbackRouteDefinition = {
      parser: mockParser,
      resolver: async (ctx, rows) => {
        const entries: Array<{ codePoint: string; value: string }> = [];
        for await (const row of rows) {
          entries.push({ codePoint: row.codePoint!, value: row.value as string });
        }
        return { type: "fallback", file: ctx.file.name, entries };
      },
    };

    const pipeline = definePipeline({
      id: "fallback",
      name: "Fallback",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("matched", (ctx) => ctx.file.name === "Matched.txt")],
      fallback,
    });

    const executor = createPipelineExecutor({});
    const results = await executor.run([pipeline]);
    const result = results.find((item) => item.id === "fallback")!;

    expect(result.summary.fallbackFiles).toBe(1);
    expect(result.data.length).toBe(2);
  });

  it("should error on unmatched files in strict mode", async () => {
    const files = [createMockFile("Matched.txt"), createMockFile("Unmatched.txt")];
    const contents = {
      "ucd/Matched.txt": "0041;A",
      "ucd/Unmatched.txt": "0042;B",
    };

    const pipeline = definePipeline({
      id: "strict",
      name: "Strict",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("matched", (ctx) => ctx.file.name === "Matched.txt")],
      strict: true,
    });

    const executor = createPipelineExecutor({});
    const results = await executor.run([pipeline]);
    const result = results.find((item) => item.id === "strict")!;

    const fileErrors = result.errors.filter((error) => error.scope === "file");
    expect(fileErrors.length).toBe(1);
    expect(fileErrors[0]?.message).toContain("No matching route");
  });
});

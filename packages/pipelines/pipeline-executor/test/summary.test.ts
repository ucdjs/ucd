import type { PipelineSummary } from "../src/types";
import { definePipeline } from "@ucdjs/pipelines-core";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createPipelineExecutor } from "../src/executor";
import { createMockFile, createTestRoute, createTestSource } from "./helpers";

describe("executor summary", () => {
  it("should record matched and skipped counts", async () => {
    const files = [
      createMockFile("Match.txt"),
      createMockFile("Skip.txt"),
    ];
    const contents = {
      "ucd/Match.txt": "0041;A",
      "ucd/Skip.txt": "0042;B",
    };

    const pipeline = definePipeline({
      id: "summary",
      name: "Summary",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("match", (ctx) => ctx.file.name === "Match.txt")],
    });

    const executor = createPipelineExecutor({});
    const results = await executor.run([pipeline]);
    const result = results.find((item) => item.id === "summary")!;

    expect(result.summary.totalFiles).toBe(2);
    expect(result.summary.matchedFiles).toBe(1);
    expect(result.summary.skippedFiles).toBe(1);
    expectTypeOf(result.summary).toMatchTypeOf<PipelineSummary>();
  });
});

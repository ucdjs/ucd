import type { FileContext } from "@ucdjs/pipelines-core";
import { definePipeline } from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import { createPipelineExecutor } from "../src/executor";
import { createMockFile, createTestRoute, createTestSource } from "./helpers";

describe("executor traces", () => {
  it("should run pipeline and version spans successfully", async () => {
    const files: FileContext[] = [createMockFile("Test.txt")];
    const contents = { "ucd/Test.txt": "0041;A" };

    const pipeline = definePipeline({
      id: "traces",
      name: "Traces",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("route", () => true)],
    });

    const executor = createPipelineExecutor({});
    const results = await executor.run([pipeline]);
    const result = results.find((r) => r.id === "traces");

    expect(result?.status).toBe("completed");
    expect(result?.summary.matchedFiles).toBeGreaterThan(0);
  });
});

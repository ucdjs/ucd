import { definePipeline } from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import { createMemoryCacheStore } from "../src/cache";
import { createPipelineExecutor } from "../src/executor";
import { createMockFile, createTestRoute, createTestSource } from "./helpers";

describe("executor cache behavior", () => {
  it("should record cache miss on first run and cache hit on second run", async () => {
    const cacheStore = createMemoryCacheStore();
    const files = [createMockFile("Cache.txt")];
    const contents = { "ucd/Cache.txt": "0041;A" };

    const pipeline = definePipeline({
      id: "cache",
      name: "Cache",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("cache-route", () => true)],
    });

    const executor = createPipelineExecutor({ cacheStore });

    const [firstResult] = await executor.run([pipeline], { cache: true });
    expect(firstResult?.summary.cached).toBe(0);

    const [secondResult] = await executor.run([pipeline], { cache: true });
    expect(secondResult?.summary.cached).toBeGreaterThan(0);
  });
});

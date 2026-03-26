import type { PipelineTraceRecord } from "../src/run/traces";
import { definePipeline } from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import { createMemoryCacheStore } from "../src/cache";
import { createPipelineExecutor } from "../src/executor";
import { createMockFile, createTestRoute, createTestSource } from "./helpers";

describe("executor cache behavior", () => {
  it("should emit cache traces with cache enabled", async () => {
    const traces: PipelineTraceRecord[] = [];
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

    const executor = createPipelineExecutor({
      cacheStore,
      onTrace: (trace) => {
        traces.push(trace);
      },
    });

    await executor.run([pipeline], { cache: true });

    const cacheTraces = traces.filter((trace) =>
      trace.kind === "cache.hit" || trace.kind === "cache.miss" || trace.kind === "cache.store",
    );

    expect(cacheTraces.length).toBeGreaterThan(0);
  });
});

import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { definePipeline } from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import { createMemoryCacheStore } from "../src/cache";
import { createPipelineExecutor } from "../src/executor";
import { createMockFile, createTestRoute, createTestSource } from "./helpers";

describe("executor cache behavior", () => {
  it("should emit cache events with cache enabled", async () => {
    const events: PipelineEvent[] = [];
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
      onEvent: (event) => {
        events.push(event);
        return undefined;
      },
    });

    await executor.run([pipeline], { cache: true });

    const cacheEvents = events.filter((event) =>
      event.type === "cache:hit" || event.type === "cache:miss" || event.type === "cache:store",
    );

    expect(cacheEvents.length).toBeGreaterThan(0);
  });
});

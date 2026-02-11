import type { FileContext, PipelineEvent } from "@ucdjs/pipelines-core";
import { definePipeline } from "@ucdjs/pipelines-core";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createPipelineExecutor } from "../src/executor";
import { createMockFile, createTestRoute, createTestSource } from "./helpers";

describe("executor events", () => {
  it("should emit pipeline and version events", async () => {
    const events: PipelineEvent[] = [];
    const files: FileContext[] = [createMockFile("Test.txt")];
    const contents = { "ucd/Test.txt": "0041;A" };

    const pipeline = definePipeline({
      id: "events",
      name: "Events",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [createTestRoute("route", () => true)],
    });

    const executor = createPipelineExecutor({
      onEvent: (event) => {
        events.push(event);
        return undefined;
      },
    });

    await executor.run([pipeline]);

    expect(events.some((event) => event.type === "pipeline:start")).toBe(true);
    expect(events.some((event) => event.type === "pipeline:end")).toBe(true);
    expect(events.some((event) => event.type === "version:start")).toBe(true);
    expect(events.some((event) => event.type === "version:end")).toBe(true);
    expectTypeOf(events).toMatchTypeOf<PipelineEvent[]>();
  });
});

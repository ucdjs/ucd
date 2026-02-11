import type { PipelineArtifactDefinition } from "@ucdjs/pipelines-artifacts";
import { definePipelineArtifact } from "@ucdjs/pipelines-artifacts";
import { definePipeline } from "@ucdjs/pipelines-core";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createPipelineExecutor } from "../src/executor";
import { createMockFile, createTestRoute, createTestSource } from "./helpers";

describe("pipeline artifacts", () => {
  it("should build global artifacts before route execution", async () => {
    const files = [createMockFile("Test.txt")];
    const contents = { "ucd/Test.txt": "0041;A" };

    const artifactDefinition = definePipelineArtifact({
      id: "version-info",
      build: async ({ version }) => ({ version }),
    });

    expectTypeOf(artifactDefinition).toMatchTypeOf<PipelineArtifactDefinition>();

    const route = createTestRoute("artifact-route", () => true);

    const pipeline = definePipeline({
      id: "artifact-pipeline",
      name: "Artifact Pipeline",
      versions: ["16.0.0"],
      inputs: [createTestSource(files, contents)],
      routes: [route],
    });

    const executor = createPipelineExecutor({ artifacts: [artifactDefinition] });
    const result = await executor.run([pipeline]);
    const pipelineResult = result.find((item) => item.id === "artifact-pipeline")!;

    expect(pipelineResult.data[0]).toMatchObject({
      artifact: { version: "16.0.0" },
    });
  });
});

import { describe, expect, it } from "vitest";
import { loadPipelineFromContent } from "../src/insecure";
import { createPipelineModuleSource } from "#test-utils/pipelines";

describe("loadPipelineFromContent", () => {
  it("should load pipeline definitions and export names", async () => {
    const content = createPipelineModuleSource({
      named: ["alpha"],
      extraExports: "export const config = { name: \"pipeline\" };",
    });

    const result = await loadPipelineFromContent(content, "remote.ucd-pipeline.ts");

    expect(result.filePath).toBe("remote.ucd-pipeline.ts");
    expect(result.exportNames).toEqual(["alpha"]);
    expect(result.exportNames).toHaveLength(1);
    expect(result.pipelines.map((pipeline) => pipeline.id)).toEqual(["alpha"]);
  });

  it("should return empty arrays when no pipelines are exported", async () => {
    const content = "export const config = { ok: true };";

    const result = await loadPipelineFromContent(content, "empty.ucd-pipeline.ts");

    expect(result.pipelines).toEqual([]);
    expect(result.exportNames).toEqual([]);
  });

  it("should load multiple named pipelines", async () => {
    const content = createPipelineModuleSource({
      named: ["alpha", "beta"],
    });

    const result = await loadPipelineFromContent(content, "multi.ucd-pipeline.ts");

    expect(result.pipelines.map((pipeline) => pipeline.id).sort()).toEqual(["alpha", "beta"]);
    expect(result.exportNames.sort()).toEqual(["alpha", "beta"]);
  });

  it("should ignore non-pipeline named exports", async () => {
    const content = createPipelineModuleSource({
      named: ["alpha"],
      extraExports: "export const meta = { ok: true };",
    });

    const result = await loadPipelineFromContent(content, "extra.ucd-pipeline.ts");

    expect(result.pipelines.map((pipeline) => pipeline.id)).toEqual(["alpha"]);
    expect(result.exportNames).toEqual(["alpha"]);
  });

  it("should ignore default exports", async () => {
    const content = createPipelineModuleSource({
      named: ["alpha"],
      extraExports: "export default { _type: \"pipeline-definition\", id: \"default-only\", versions: [\"16.0.0\"], inputs: [], routes: [] };",
    });

    const result = await loadPipelineFromContent(content, "default.ucd-pipeline.ts");

    expect(result.pipelines.map((pipeline) => pipeline.id)).toEqual(["alpha"]);
    expect(result.exportNames).toEqual(["alpha"]);
  });

  it("should throw on invalid source code", async () => {
    const content = "export const broken = ;";

    await expect(
      loadPipelineFromContent(content, "broken.ucd-pipeline.ts"),
    ).rejects.toBeInstanceOf(Error);
  });
});

import { encodeBase64 } from "#test-utils";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { createPipelineModuleSource } from "#test-utils/pipelines";
import { describe, expect, it } from "vitest";
import { loadPipelineFromContent } from "../src/insecure";

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

  it("should resolve relative imports without extensions", async () => {
    const depSource = "export const helper = { ok: true };";
    const depEncoded = encodeBase64(depSource);

    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/contents/pipelines%2Fdep.ts",
        () => HttpResponse.json({ content: depEncoded, encoding: "base64" }),
      ],
    ]);

    const content = [
      "import { helper } from './dep';",
      "export const alpha = { _type: 'pipeline-definition', id: 'alpha', versions: ['16.0.0'], inputs: [], routes: [] };",
      "export const meta = helper;",
    ].join("\n");

    const result = await loadPipelineFromContent(content, "pipelines/main.ucd-pipeline.ts", {
      identifier: "github://ucdjs/demo-pipelines?ref=main&path=pipelines/main.ucd-pipeline.ts",
    });

    expect(result.pipelines.map((pipeline) => pipeline.id)).toEqual(["alpha"]);
    expect(result.exportNames).toEqual(["alpha"]);
  });

  it("should reject full URL import specifiers", async () => {
    const content = "import data from 'https://luxass.dev/pipelines/dep.ts';\nexport const alpha = { _type: 'pipeline-definition', id: 'alpha', versions: ['16.0.0'], inputs: [], routes: [] };";

    await expect(
      loadPipelineFromContent(content, "pipelines/main.ucd-pipeline.ts", {
        identifier: "github://ucdjs/demo-pipelines?ref=main&path=pipelines/main.ucd-pipeline.ts",
      }),
    ).rejects.toThrow("Unsupported import specifier");
  });

  it("should reject bare import specifiers", async () => {
    const content = "import zod from 'zod';\nexport const alpha = { _type: 'pipeline-definition', id: 'alpha', versions: ['16.0.0'], inputs: [], routes: [] };";

    await expect(
      loadPipelineFromContent(content, "pipelines/main.ucd-pipeline.ts", {
        identifier: "github://ucdjs/demo-pipelines?ref=main&path=pipelines/main.ucd-pipeline.ts",
      }),
    ).rejects.toThrow("Unsupported import specifier");
  });

  it("should throw on invalid source code", async () => {
    const content = "export const broken = ;";

    await expect(
      loadPipelineFromContent(content, "broken.ucd-pipeline.ts"),
    ).rejects.toBeInstanceOf(Error);
  });
});

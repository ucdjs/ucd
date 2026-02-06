import { encodeBase64 } from "#test-utils";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { createPipelineModuleSource } from "#test-utils/pipelines";
import { describe, expect, it } from "vitest";
import { findRemotePipelineFiles, loadRemotePipelines } from "../src/remote";

describe("findRemotePipelineFiles", () => {
  it("should list GitHub files and apply path + pattern filtering", async () => {
    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/git/trees/main?recursive=1",
        () => HttpResponse.json({
          tree: [
            { path: "pipelines/alpha.ucd-pipeline.ts", type: "blob" },
            { path: "pipelines/notes.txt", type: "blob" },
            { path: "other/beta.ucd-pipeline.ts", type: "blob" },
            { path: "pipelines/subdir", type: "tree" },
          ],
          truncated: false,
        }),
      ],
    ]);

    const result = await findRemotePipelineFiles({
      type: "github",
      id: "demo-pipelines",
      owner: "ucdjs",
      repo: "demo-pipelines",
      ref: "main",
      path: "pipelines",
    });

    expect(result.files).toEqual(["pipelines/alpha.ucd-pipeline.ts"]);
    expect(result.truncated).toBe(false);
  });

  it("should list GitLab files and apply pattern filtering", async () => {
    mockFetch([
      [
        "GET",
        "https://gitlab.com/api/v4/projects/ucdjs%2Fdemo-pipelines/repository/tree?recursive=true&ref=main&path=pipelines&per_page=100",
        () => HttpResponse.json([
          { path: "pipelines/alpha.ucd-pipeline.ts", type: "blob" },
          { path: "pipelines/notes.txt", type: "blob" },
          { path: "pipelines/subdir", type: "tree" },
        ]),
      ],
    ]);

    const result = await findRemotePipelineFiles({
      type: "gitlab",
      id: "demo-pipelines",
      owner: "ucdjs",
      repo: "demo-pipelines",
      ref: "main",
      path: "pipelines",
    });

    expect(result.files).toEqual(["pipelines/alpha.ucd-pipeline.ts"]);
    expect(result.truncated).toBe(false);
  });
});

describe("loadRemotePipelines", () => {
  it("should load GitHub pipeline files", async () => {
    const alpha = createPipelineModuleSource({ named: ["alpha"] });
    const beta = createPipelineModuleSource({ named: ["beta"] });

    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/contents/pipelines%2Falpha.ucd-pipeline.ts?ref=main",
        () => HttpResponse.json({ content: encodeBase64(alpha), encoding: "base64" }),
      ],
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/contents/pipelines%2Fbeta.ucd-pipeline.ts?ref=main",
        () => HttpResponse.json({ content: encodeBase64(beta), encoding: "base64" }),
      ],
    ]);

    const result = await loadRemotePipelines(
      { type: "github", id: "demo-pipelines", owner: "ucdjs", repo: "demo-pipelines", ref: "main" },
      ["pipelines/alpha.ucd-pipeline.ts", "pipelines/beta.ucd-pipeline.ts"],
    );

    expect(result.errors).toEqual([]);
    expect(result.files).toHaveLength(2);
    expect(result.pipelines.map((p) => p.id).sort()).toEqual(["alpha", "beta"]);
  });

  it("should collect GitHub errors when files fail", async () => {
    const alpha = createPipelineModuleSource({ named: ["alpha"] });

    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/contents/pipelines%2Falpha.ucd-pipeline.ts?ref=main",
        () => HttpResponse.json({ content: encodeBase64(alpha), encoding: "base64" }),
      ],
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/contents/pipelines%2Fbeta.ucd-pipeline.ts?ref=main",
        () => HttpResponse.text("Not found", { status: 404 }),
      ],
    ]);

    const result = await loadRemotePipelines(
      { type: "github", id: "demo-pipelines", owner: "ucdjs", repo: "demo-pipelines", ref: "main" },
      ["pipelines/alpha.ucd-pipeline.ts", "pipelines/beta.ucd-pipeline.ts"],
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.filePath).toBe("pipelines/beta.ucd-pipeline.ts");
    expect(result.files).toHaveLength(1);
    expect(result.pipelines.map((p) => p.id)).toEqual(["alpha"]);
  });

  it("should throw for GitHub when throwOnError is enabled", async () => {
    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/contents/pipelines%2Fmissing.ucd-pipeline.ts?ref=main",
        () => HttpResponse.text("Not found", { status: 404 }),
      ],
    ]);

    await expect(
      loadRemotePipelines(
        { type: "github", id: "demo-pipelines", owner: "ucdjs", repo: "demo-pipelines", ref: "main" },
        ["pipelines/missing.ucd-pipeline.ts"],
        { throwOnError: true },
      ),
    ).rejects.toThrow("Failed to load pipeline file: pipelines/missing.ucd-pipeline.ts");
  });

  it("should load GitLab pipeline files", async () => {
    const alpha = createPipelineModuleSource({ named: ["alpha"] });
    const beta = createPipelineModuleSource({ named: ["beta"] });

    mockFetch([
      [
        "GET",
        "https://gitlab.com/api/v4/projects/ucdjs%2Fdemo-pipelines/repository/files/pipelines%2Falpha.ucd-pipeline.ts/raw?ref=main",
        () => HttpResponse.text(alpha),
      ],
      [
        "GET",
        "https://gitlab.com/api/v4/projects/ucdjs%2Fdemo-pipelines/repository/files/pipelines%2Fbeta.ucd-pipeline.ts/raw?ref=main",
        () => HttpResponse.text(beta),
      ],
    ]);

    const result = await loadRemotePipelines(
      { type: "gitlab", id: "demo-pipelines", owner: "ucdjs", repo: "demo-pipelines", ref: "main" },
      ["pipelines/alpha.ucd-pipeline.ts", "pipelines/beta.ucd-pipeline.ts"],
    );

    expect(result.errors).toEqual([]);
    expect(result.files).toHaveLength(2);
    expect(result.pipelines.map((p) => p.id).sort()).toEqual(["alpha", "beta"]);
  });

  it("should collect GitLab errors when files fail", async () => {
    const alpha = createPipelineModuleSource({ named: ["alpha"] });

    mockFetch([
      [
        "GET",
        "https://gitlab.com/api/v4/projects/ucdjs%2Fdemo-pipelines/repository/files/pipelines%2Falpha.ucd-pipeline.ts/raw?ref=main",
        () => HttpResponse.text(alpha),
      ],
      [
        "GET",
        "https://gitlab.com/api/v4/projects/ucdjs%2Fdemo-pipelines/repository/files/pipelines%2Fbeta.ucd-pipeline.ts/raw?ref=main",
        () => HttpResponse.text("Not found", { status: 404 }),
      ],
    ]);

    const result = await loadRemotePipelines(
      { type: "gitlab", id: "demo-pipelines", owner: "ucdjs", repo: "demo-pipelines", ref: "main" },
      ["pipelines/alpha.ucd-pipeline.ts", "pipelines/beta.ucd-pipeline.ts"],
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.filePath).toBe("pipelines/beta.ucd-pipeline.ts");
    expect(result.files).toHaveLength(1);
    expect(result.pipelines.map((p) => p.id)).toEqual(["alpha"]);
  });

  it("should throw for GitLab when throwOnError is enabled", async () => {
    mockFetch([
      [
        "GET",
        "https://gitlab.com/api/v4/projects/ucdjs%2Fdemo-pipelines/repository/files/pipelines%2Fmissing.ucd-pipeline.ts/raw?ref=main",
        () => HttpResponse.text("Not found", { status: 404 }),
      ],
    ]);

    await expect(
      loadRemotePipelines(
        { type: "gitlab", id: "demo-pipelines", owner: "ucdjs", repo: "demo-pipelines", ref: "main" },
        ["pipelines/missing.ucd-pipeline.ts"],
        { throwOnError: true },
      ),
    ).rejects.toThrow("Failed to load pipeline file: pipelines/missing.ucd-pipeline.ts");
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { testdir } from "vitest-testdirs";
import { sourcesPipelineRouter } from "../../src/server/routes";
import { createTestRoutesApp } from "./helpers";

vi.mock("@ucdjs-internal/shared/config", async () => {
  const actual = await vi.importActual("@ucdjs-internal/shared/config");
  return {
    ...actual,
    getUcdConfigPath: vi.fn(),
  };
});

const getUcdConfigPathMock = vi.mocked(await import("@ucdjs-internal/shared/config")).getUcdConfigPath;

describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId", () => {
  beforeEach(() => {
    getUcdConfigPathMock.mockReset();
  });

  it("returns exactly the pipeline payload", async () => {
    const { app } = await createTestRoutesApp([sourcesPipelineRouter]);

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/simple"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Object.keys(data)).toEqual(["pipeline"]);
    expect(data.pipeline).toEqual(expect.objectContaining({
      id: "simple",
      versions: expect.any(Array),
      routes: expect.any(Array),
    }));
  });

  it("returns 404 for an unknown pipeline", async () => {
    const { app } = await createTestRoutesApp([sourcesPipelineRouter]);

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/missing"));

    expect(res.status).toBe(404);
  });
});

describe("POST /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/execute", () => {
  beforeEach(() => {
    getUcdConfigPathMock.mockReset();
  });

  it("starts an execution for a local source", async () => {
    const { app } = await createTestRoutesApp([sourcesPipelineRouter]);

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/simple/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versions: ["16.0.0"] }),
    }));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(expect.objectContaining({
      success: true,
      executionId: expect.any(String),
    }));
  });

  it("starts an execution for a cached remote source", async () => {
    const tmpBaseDir = await testdir({
      github: {
        ucdjs: {
          "ucd-pipelines": {
            main: {
              ".ucd-cache.json": JSON.stringify({
                source: "github",
                owner: "ucdjs",
                repo: "ucd-pipelines",
                ref: "main",
                commitSha: "abc123",
                syncedAt: new Date().toISOString(),
              }),
              src: {
                "simple.ucd-pipeline.ts": /* ts */`
                  export const simplePipeline = {
                    _type: "pipeline-definition",
                    id: "simple",
                    name: "Simple",
                    versions: ["16.0.0"],
                    inputs: [],
                    routes: [],
                  };
                `,
              },
            },
          },
        },
      },
    });

    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);

    const { app } = await createTestRoutesApp([sourcesPipelineRouter], {
      sources: [{
        kind: "remote",
        id: "remote",
        provider: "github",
        owner: "ucdjs",
        repo: "ucd-pipelines",
        ref: "main",
        path: "src",
      }],
    });

    const res = await app.fetch(new Request("http://localhost/api/sources/remote/files/simple/pipelines/simple/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versions: ["16.0.0"] }),
    }));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(expect.objectContaining({
      success: true,
      executionId: expect.any(String),
    }));
  });

  it("returns 404 for an unknown pipeline", async () => {
    const { app } = await createTestRoutesApp([sourcesPipelineRouter]);

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/missing/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versions: ["16.0.0"] }),
    }));

    expect(res.status).toBe(404);
  });
});

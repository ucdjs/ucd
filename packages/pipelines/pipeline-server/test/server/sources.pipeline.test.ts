import { schema } from "#server/db";
import { sourcesPipelineRouter } from "#server/routes";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import {
  createTestRoutesApp,
  DEFAULT_DISCOVERABLE_FILE_ID,
  DEFAULT_DISCOVERABLE_PIPELINE_ID,
} from "./helpers";

vi.mock("@ucdjs/env", async () => {
  const actual = await vi.importActual("@ucdjs/env");
  return {
    ...actual,
    getUcdConfigPath: vi.fn(),
  };
});

const getUcdConfigPathMock = vi.mocked(await import("@ucdjs/env")).getUcdConfigPath;

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId", () => {
  beforeEach(() => {
    getUcdConfigPathMock.mockReset();
  });

  it("returns exactly the pipeline payload", async () => {
    const { app } = await createTestRoutesApp([sourcesPipelineRouter]);

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/${DEFAULT_DISCOVERABLE_FILE_ID}/pipelines/${DEFAULT_DISCOVERABLE_PIPELINE_ID}`,
    ));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(expect.objectContaining({
      id: DEFAULT_DISCOVERABLE_PIPELINE_ID,
      versions: expect.any(Array),
      routes: expect.any(Array),
    }));
  });

  it("returns 404 for an unknown pipeline", async () => {
    const { app } = await createTestRoutesApp([sourcesPipelineRouter]);

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/${DEFAULT_DISCOVERABLE_FILE_ID}/pipelines/missing`,
    ));

    expect(res.status).toBe(404);
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("POST /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/execute", () => {
  beforeEach(() => {
    getUcdConfigPathMock.mockReset();
  });

  it("starts an execution for a local source", async () => {
    const { app, db } = await createTestRoutesApp([sourcesPipelineRouter]);

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/${DEFAULT_DISCOVERABLE_FILE_ID}/pipelines/${DEFAULT_DISCOVERABLE_PIPELINE_ID}/execute`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versions: ["16.0.0"] }),
      },
    ));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(expect.objectContaining({
      success: true,
      executionId: expect.any(String),
    }));

    const [execution] = await db
      .select()
      .from(schema.executions)
      .where(eq(schema.executions.id, data.executionId))
      .limit(1);

    expect(execution).toEqual(expect.objectContaining({
      id: data.executionId,
      workspaceId: "test",
      sourceId: "local",
      fileId: DEFAULT_DISCOVERABLE_FILE_ID,
      pipelineId: DEFAULT_DISCOVERABLE_PIPELINE_ID,
    }));
    expect(["completed", "failed"]).toContain(execution?.status);
  });

  it("recreates a missing workspace row before starting an execution", async () => {
    const { app, db } = await createTestRoutesApp([sourcesPipelineRouter]);

    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, "test"));

    const res = await app.fetch(new Request(`http://localhost/api/sources/local/files/${DEFAULT_DISCOVERABLE_FILE_ID}/pipelines/${DEFAULT_DISCOVERABLE_PIPELINE_ID}/execute`, {
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

    const [workspace] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.id, "test")).limit(1);
    expect(workspace).toBeDefined();
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
              "src": {
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

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/${DEFAULT_DISCOVERABLE_FILE_ID}/pipelines/missing/execute`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versions: ["16.0.0"] }),
      },
    ));

    expect(res.status).toBe(404);
  });
});

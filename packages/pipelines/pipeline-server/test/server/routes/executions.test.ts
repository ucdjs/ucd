import { sourcesExecutionsRouter } from "#server/routes/executions";
import { describe, expect, it } from "vitest";
import { createTestRoutesApp } from "../helpers";

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions", () => {
  it("returns an empty list when no executions exist", async () => {
    const { app } = await createTestRoutesApp([sourcesExecutionsRouter]);

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/simple/executions"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual({
      executions: [],
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });
  });

  it("returns executions ordered by most recent start time", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesExecutionsRouter], {
      seed: {
        executions: [
          {
            pipelineId: "simple",
            startedAt: new Date("2026-01-01T00:00:00.000Z"),
            completedAt: new Date("2026-01-01T00:00:05.000Z"),
            summary: {
              versions: ["16.0.0"],
              totalRoutes: 1,
              cached: 0,
              totalFiles: 1,
              matchedFiles: 1,
              skippedFiles: 0,
              fallbackFiles: 0,
              totalOutputs: 1,
              durationMs: 5_000,
            },
          },
          {
            pipelineId: "simple",
            startedAt: new Date("2026-01-01T01:00:00.000Z"),
            completedAt: new Date("2026-01-01T01:00:05.000Z"),
            summary: {
              versions: ["16.0.0"],
              totalRoutes: 2,
              cached: 1,
              totalFiles: 1,
              matchedFiles: 1,
              skippedFiles: 0,
              fallbackFiles: 0,
              totalOutputs: 1,
              durationMs: 5_000,
            },
          },
        ],
      },
    });
    const olderId = seeded.executionIds[0]!;
    const newerId = seeded.executionIds[1]!;

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/simple/executions?limit=10&offset=0"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.executions.map((execution: { id: string }) => execution.id)).toEqual([newerId, olderId]);
    expect(data.executions[0]).toEqual(expect.objectContaining({
      sourceId: "local",
      fileId: "simple",
      pipelineId: "simple",
      summary: expect.objectContaining({
        totalRoutes: 2,
        cached: 1,
      }),
    }));
    expect(data.pagination).toEqual({
      total: 2,
      limit: 10,
      offset: 0,
      hasMore: false,
    });
  });

  it("scopes executions to the requested source and file", async () => {
    const { app } = await createTestRoutesApp([sourcesExecutionsRouter], {
      seed: {
        executions: [
          {
            sourceId: "local",
            fileId: "simple",
            pipelineId: "simple",
          },
          {
            sourceId: "other-source",
            fileId: "other-file",
            pipelineId: "simple",
          },
        ],
      },
    });

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/simple/executions"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.executions).toHaveLength(1);
    expect(data.executions[0]).toEqual(expect.objectContaining({
      sourceId: "local",
      fileId: "simple",
      pipelineId: "simple",
    }));
  });

  it("falls back to safe defaults for invalid pagination values", async () => {
    const { app } = await createTestRoutesApp([sourcesExecutionsRouter], {
      seed: {
        executions: [{}],
      },
    });

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/simple/executions?limit=abc&offset=nope"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.pagination).toEqual({
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });
});

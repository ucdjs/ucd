import { sourcesExecutionsRouter } from "#server/routes/sources.executions";
import { describe, expect, it } from "vitest";
import { createTestRoutesApp, seedExecution } from "./helpers";

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
    const { app, db } = await createTestRoutesApp([sourcesExecutionsRouter]);

    const olderId = await seedExecution(db, {
      pipelineId: "simple",
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
      completedAt: new Date("2026-01-01T00:00:05.000Z"),
      summary: { totalRoutes: 1, cached: 0 } as never,
    });
    const newerId = await seedExecution(db, {
      pipelineId: "simple",
      startedAt: new Date("2026-01-01T01:00:00.000Z"),
      completedAt: new Date("2026-01-01T01:00:05.000Z"),
      summary: { totalRoutes: 2, cached: 1 } as never,
    });

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/simple/executions?limit=10&offset=0"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.executions.map((execution: { id: string }) => execution.id)).toEqual([newerId, olderId]);
    expect(data.executions[0]).toEqual(expect.objectContaining({
      sourceId: "local",
      fileId: "simple",
      pipelineId: "simple",
    }));
    expect(data.pagination).toEqual({
      total: 2,
      limit: 10,
      offset: 0,
      hasMore: false,
    });
  });
});

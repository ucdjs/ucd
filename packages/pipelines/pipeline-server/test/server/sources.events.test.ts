import { describe, expect, it } from "vitest";
import { sourcesEventsRouter } from "../../src/server/routes";
import { createTestRoutesApp, seedExecution, seedExecutionEvent } from "./helpers";

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/events", () => {
  it("returns paginated events for an execution", async () => {
    const { app, db } = await createTestRoutesApp([sourcesEventsRouter]);
    const executionId = await seedExecution(db);

    await seedExecutionEvent(db, {
      executionId,
      timestamp: new Date("2026-01-01T00:00:01.000Z"),
    });
    await seedExecutionEvent(db, {
      executionId,
      type: "pipeline:complete",
      timestamp: new Date("2026-01-01T00:00:02.000Z"),
      data: {
        type: "pipeline:complete",
        timestamp: "2026-01-01T00:00:02.000Z",
        executionId,
        pipelineId: "simple",
        workspaceId: "test",
      } as never,
    });

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/events?limit=1&offset=0`,
    ));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(expect.objectContaining({
      executionId,
      pipelineId: "simple",
      status: "completed",
      events: [expect.objectContaining({ id: expect.any(String), type: "pipeline:start" })],
      pagination: {
        total: 2,
        limit: 1,
        offset: 0,
        hasMore: true,
      },
    }));
  });

  it("returns 404 for a missing execution", async () => {
    const { app } = await createTestRoutesApp([sourcesEventsRouter]);

    const res = await app.fetch(new Request(
      "http://localhost/api/sources/local/files/simple/pipelines/simple/executions/missing/events",
    ));

    expect(res.status).toBe(404);
  });
});

import { sourcesEventsRouter } from "#server/routes";
import { describe, expect, it } from "vitest";
import { createTestRoutesApp } from "./helpers";

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/events", () => {
  it("returns paginated events for an execution", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesEventsRouter], {
      seed: {
        executions: [{
          events: [
            {
              timestamp: new Date("2026-01-01T00:00:01.000Z"),
            },
            {
              type: "pipeline:end",
              timestamp: new Date("2026-01-01T00:00:02.000Z"),
            },
          ],
        }],
      },
    });
    const executionId = seeded.executionIds[0]!;

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

  it("returns 404 when the execution route context does not match", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesEventsRouter], {
      seed: {
        executions: [{
          sourceId: "other-source",
          fileId: "other-file",
          pipelineId: "other-pipeline",
        }],
      },
    });
    const executionId = seeded.executionIds[0]!;

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/events`,
    ));

    expect(res.status).toBe(404);
  });
});

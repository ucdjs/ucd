import { sourcesGraphRouter } from "#server/routes";
import { describe, expect, it } from "vitest";
import { createTestRoutesApp, seedExecution } from "./helpers";

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/graph", () => {
  it("returns graph data and status", async () => {
    const { app, db } = await createTestRoutesApp([sourcesGraphRouter]);
    const executionId = await seedExecution(db, {
      graph: {
        nodes: [],
        edges: [],
      } as never,
    });

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/graph`,
    ));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual({
      executionId,
      pipelineId: "simple",
      status: "completed",
      graph: {
        nodes: [],
        edges: [],
      },
    });
  });

  it("returns null when the execution has no graph", async () => {
    const { app, db } = await createTestRoutesApp([sourcesGraphRouter]);
    const executionId = await seedExecution(db);

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/graph`,
    ));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(expect.objectContaining({
      executionId,
      graph: null,
    }));
  });

  it("returns 404 for a missing execution", async () => {
    const { app } = await createTestRoutesApp([sourcesGraphRouter]);

    const res = await app.fetch(new Request(
      "http://localhost/api/sources/local/files/simple/pipelines/simple/executions/missing/graph",
    ));

    expect(res.status).toBe(404);
  });

  it("returns 404 when the execution belongs to another pipeline", async () => {
    const { app, db } = await createTestRoutesApp([sourcesGraphRouter]);
    const executionId = await seedExecution(db, {
      pipelineId: "other",
      graph: {
        nodes: [],
        edges: [],
      } as never,
    });

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/graph`,
    ));

    expect(res.status).toBe(404);
  });
});

import { sourcesGraphRouter } from "#server/routes";
import { describe, expect, it } from "vitest";
import { createTestRoutesApp, seedExecution } from "./helpers";

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/graph", () => {
  it("returns graph data and status", async () => {
    const { app, db } = await createTestRoutesApp([sourcesGraphRouter]);
    const executionId = await seedExecution(db, {
      graph: {
        nodes: [
          { id: "source-1", type: "source", version: "1.0.0" },
          { id: "output-1", type: "output", outputIndex: 0 },
        ],
        edges: [
          { from: "source-1", to: "output-1", type: "resolved" },
        ],
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
        nodes: [
          {
            id: "source-1",
            nodeType: "source",
            flowType: "pipeline-source",
            label: "v1.0.0",
            detailFields: [
              { label: "Node ID", type: "text", value: "source-1" },
              { label: "Version", type: "text", value: "1.0.0" },
            ],
          },
          {
            id: "output-1",
            nodeType: "output",
            flowType: "pipeline-output",
            label: "Output[0]",
            detailFields: [
              { label: "Node ID", type: "text", value: "output-1" },
              { label: "Output Index", type: "text", value: 0 },
            ],
          },
        ],
        edges: [
          {
            id: "edge-0-source-1-output-1",
            source: "source-1",
            target: "output-1",
            label: "resolved",
            edgeType: "resolved",
          },
        ],
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

  it("returns 404 when the execution belongs to another source or file", async () => {
    const { app, db } = await createTestRoutesApp([sourcesGraphRouter]);
    const executionId = await seedExecution(db, {
      sourceId: "other-source",
      fileId: "other-file",
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

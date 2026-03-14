import { sourcesLogsRouter } from "#server/routes";
import { describe, expect, it } from "vitest";
import { createTestRoutesApp } from "./helpers";

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/logs", () => {
  it("returns paginated logs and supports span filtering", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesLogsRouter], {
      seed: {
        executions: [{
          logs: [
            {
              spanId: "span-1",
              message: "first log",
              payload: {
                message: "first log",
                stream: "stdout",
                truncated: true,
                originalSize: 2048,
              },
            },
            {
              spanId: "span-2",
              message: "second log",
            },
          ],
        }],
      },
    });
    const executionId = seeded.executionIds[0]!;

    const allLogsRes = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/logs?limit=10&offset=0`,
    ));

    expect(allLogsRes.status).toBe(200);

    const allLogs = await allLogsRes.json();
    expect(allLogs).toEqual(expect.objectContaining({
      executionId,
      pipelineId: "simple",
      status: "completed",
      truncated: true,
      originalSize: 2048,
      pagination: {
        total: 2,
        limit: 10,
        offset: 0,
        hasMore: false,
      },
    }));
    expect(allLogs.logs).toHaveLength(2);
    expect(allLogs.capturedSize).toBeGreaterThan(0);

    const filteredRes = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/logs?spanId=span-1`,
    ));

    expect(filteredRes.status).toBe(200);

    const filtered = await filteredRes.json();
    expect(filtered.logs).toHaveLength(1);
    expect(filtered.logs[0]).toEqual(expect.objectContaining({
      spanId: "span-1",
      message: "first log",
    }));
  });

  it("returns 404 for a missing execution", async () => {
    const { app } = await createTestRoutesApp([sourcesLogsRouter]);

    const res = await app.fetch(new Request(
      "http://localhost/api/sources/local/files/simple/pipelines/simple/executions/missing/logs",
    ));

    expect(res.status).toBe(404);
  });

  it("returns 404 when the execution route context does not match", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesLogsRouter], {
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
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/logs`,
    ));

    expect(res.status).toBe(404);
  });

  it("falls back to safe defaults for invalid pagination values", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesLogsRouter], {
      seed: {
        executions: [{
          logs: [{
            message: "first log",
          }],
        }],
      },
    });
    const executionId = seeded.executionIds[0]!;

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/logs?limit=abc&offset=nope`,
    ));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.pagination).toEqual({
      total: 1,
      limit: 200,
      offset: 0,
      hasMore: false,
    });
  });
});

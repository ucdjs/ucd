import { describe, expect, it } from "vitest";
import { sourcesLogsRouter } from "../../src/server/routes";
import { createTestRoutesApp, seedExecution, seedExecutionLog } from "./helpers";

describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/logs", () => {
  it("returns paginated logs and supports span filtering", async () => {
    const { app, db } = await createTestRoutesApp([sourcesLogsRouter]);
    const executionId = await seedExecution(db);

    await seedExecutionLog(db, {
      executionId,
      spanId: "span-1",
      message: "first log",
      payload: {
        message: "first log",
        stream: "stdout",
        truncated: true,
        originalSize: 2048,
      },
    });
    await seedExecutionLog(db, {
      executionId,
      spanId: "span-2",
      message: "second log",
    });

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
});

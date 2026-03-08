import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createDatabase, runMigrations, schema } from "#server/db";
import { overviewRouter } from "#server/routes/overview";
import { ensureWorkspace } from "#server/workspace";
import { H3 as H3App } from "h3";
import { describe, expect, it, vi } from "vitest";

async function seedExecution(
  db: ReturnType<typeof createDatabase>,
  options: {
    pipelineId?: string;
    status?: "running" | "completed" | "failed";
    startedAt?: Date;
    completedAt?: Date | null;
    versions?: string[] | null;
    error?: string | null;
  } = {},
) {
  const executionId = randomUUID();

  await db.insert(schema.executions).values({
    id: executionId,
    workspaceId: "test",
    pipelineId: options.pipelineId ?? "simple",
    status: options.status ?? "completed",
    startedAt: options.startedAt ?? new Date("2026-01-01T00:00:00.000Z"),
    completedAt: options.completedAt ?? new Date("2026-01-01T00:00:05.000Z"),
    versions: options.versions ?? ["16.0.0"],
    summary: null,
    graph: null,
    error: options.error ?? null,
  });

  return executionId;
}

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/overview", () => {
  it("returns a 7-day activity window with zero-filled days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-08T12:00:00.000Z"));

    const db = createDatabase({ url: "file::memory:" });
    await runMigrations(db);

    const playgroundPath = fileURLToPath(new URL("../../../pipeline-playground/src", import.meta.url));
    await ensureWorkspace(db, "test", playgroundPath);

    const app = new H3App({ debug: true });
    app.use("/**", (event, next) => {
      event.context.sources = [];
      event.context.db = db;
      event.context.workspaceId = "test";
      next();
    });
    app.mount("/api/overview", overviewRouter);

    await seedExecution(db, {
      pipelineId: "simple",
      status: "completed",
      startedAt: new Date("2026-03-08T09:00:00.000Z"),
      completedAt: new Date("2026-03-08T09:00:05.000Z"),
    });
    await seedExecution(db, {
      pipelineId: "simple",
      status: "failed",
      startedAt: new Date("2026-03-05T09:00:00.000Z"),
      completedAt: new Date("2026-03-05T09:00:02.000Z"),
      error: "boom",
    });
    await seedExecution(db, {
      pipelineId: "simple",
      status: "running",
      startedAt: new Date("2026-03-08T11:00:00.000Z"),
      completedAt: null,
    });

    const res = await app.fetch(new Request("http://localhost/api/overview"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.summary).toEqual({
      total: 3,
      states: {
        pending: 0,
        running: 1,
        completed: 1,
        failed: 1,
        cancelled: 0,
      },
    });
    expect(data.activity).toEqual([
      { date: "2026-03-02", states: { pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 } },
      { date: "2026-03-03", states: { pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 } },
      { date: "2026-03-04", states: { pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 } },
      { date: "2026-03-05", states: { pending: 0, running: 0, completed: 0, failed: 1, cancelled: 0 } },
      { date: "2026-03-06", states: { pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 } },
      { date: "2026-03-07", states: { pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 } },
      { date: "2026-03-08", states: { pending: 0, running: 1, completed: 1, failed: 0, cancelled: 0 } },
    ]);
    expect(data.recentExecutions).toHaveLength(3);
    expect(data.recentExecutions[0].status).toBe("running");

    vi.useRealTimers();
  });
});

import type { OverviewResponse } from "@ucdjs/pipelines-ui/functions";
import { schema } from "#server/db";
import { EXECUTION_STATUSES } from "@ucdjs/pipelines-executor";
import { and, desc, eq, gte } from "drizzle-orm";
import { H3 } from "h3";

export const overviewRouter: H3 = new H3();

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function shiftUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function createEmptyStateCounts() {
  return Object.fromEntries(
    EXECUTION_STATUSES.map((status) => [status, 0]),
  ) as Record<(typeof EXECUTION_STATUSES)[number], number>;
}

overviewRouter.get("/", async (event) => {
  const { db, workspaceId } = event.context;
  const today = startOfUtcDay(new Date());
  const weekStart = shiftUtcDays(today, -6);

  const [windowExecutions, recentExecutions, countResult] = await Promise.all([
    db.query.executions.findMany({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        gte(schema.executions.startedAt, weekStart),
      ),
      orderBy: desc(schema.executions.startedAt),
    }),
    db.query.executions.findMany({
      where: eq(schema.executions.workspaceId, workspaceId),
      orderBy: desc(schema.executions.startedAt),
      limit: 5,
    }),
    db.query.executions.findMany({
      where: eq(schema.executions.workspaceId, workspaceId),
      columns: {
        status: true,
      },
    }),
  ]);

  const dayCounts = new Map<string, Record<(typeof EXECUTION_STATUSES)[number], number>>();
  for (let index = 0; index < 7; index += 1) {
    const date = shiftUtcDays(weekStart, index).toISOString().slice(0, 10);
    dayCounts.set(date, createEmptyStateCounts());
  }

  for (const execution of windowExecutions) {
    const key = execution.startedAt.toISOString().slice(0, 10);
    const day = dayCounts.get(key);

    if (!day) continue;
    day[execution.status] += 1;
  }

  const summaryStates = createEmptyStateCounts();
  for (const execution of countResult) {
    summaryStates[execution.status] += 1;
  }

  return {
    activity: Array.from(dayCounts.entries()).map(([date, counts]) => ({
      date,
      states: counts,
    })),
    summary: {
      total: countResult.length,
      states: summaryStates,
    },
    recentExecutions: recentExecutions.map((exec) => ({
      id: exec.id,
      status: exec.status,
      startedAt: exec.startedAt.toISOString(),
      completedAt: exec.completedAt?.toISOString() ?? null,
      versions: exec.versions,
      summary: exec.summary ?? null,
      hasGraph: Boolean(exec.graph),
      error: exec.error ?? null,
    })),
  } satisfies OverviewResponse;
});

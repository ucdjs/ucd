import type { OverviewResponse } from "#shared/schemas/overview";
import type { ExecutionStatus } from "@ucdjs/pipelines-executor";
import { schema } from "#server/db";
import { and, desc, eq, gte } from "drizzle-orm";
import { H3 } from "h3";

export const overviewRouter: H3 = new H3();

const OVERVIEW_WINDOW_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
type StateCounts = Record<ExecutionStatus, number>;
const EMPTY_STATE_COUNTS = {
  pending: 0,
  running: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,
} satisfies StateCounts;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

overviewRouter.get("/", async (event) => {
  const { db, workspaceId } = event.context;
  const today = startOfUtcDay(new Date());
  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - (OVERVIEW_WINDOW_DAYS - 1));

  const [windowExecutions, recentExecutions] = await Promise.all([
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
  ]);

  const summaryStates = { ...EMPTY_STATE_COUNTS };
  const activity = Array.from({ length: OVERVIEW_WINDOW_DAYS }, (_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + index);

    return {
      date: date.toISOString().slice(0, 10),
      ...EMPTY_STATE_COUNTS,
    };
  });

  for (const execution of windowExecutions) {
    summaryStates[execution.status] += 1;

    const dayIndex = Math.floor(
      (startOfUtcDay(execution.startedAt).getTime() - weekStart.getTime()) / DAY_IN_MS,
    );

    if (dayIndex >= 0 && dayIndex < OVERVIEW_WINDOW_DAYS) {
      activity[dayIndex]![execution.status] += 1;
    }
  }

  return {
    activity,
    summary: {
      total: windowExecutions.length,
      ...summaryStates,
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

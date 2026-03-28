import type { OverviewResponse } from "#shared/schemas/overview";
import type { ExecutionStatus } from "@ucdjs/pipelines-executor";
import { schema } from "#server/db";
import { listExecutionIdsWithTraces } from "#server/db/execution-traces";
import { and, desc, eq, gte } from "drizzle-orm";
import { H3, HTTPError } from "h3";

export const sourcesOverviewRouter: H3 = new H3();

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

sourcesOverviewRouter.get("/:sourceId/overview", async (event) => {
  const { db, workspaceId } = event.context;
  const sourceId = event.context.params?.sourceId;
  if (!sourceId) {
    throw HTTPError.status(400, "Source ID is required");
  }

  const today = startOfUtcDay(new Date());
  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - (OVERVIEW_WINDOW_DAYS - 1));

  const [windowExecutions, recentExecutions] = await Promise.all([
    db
      .select()
      .from(schema.executions)
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.sourceId, sourceId),
        gte(schema.executions.startedAt, weekStart),
      ))
      .orderBy(desc(schema.executions.startedAt)),
    db
      .select()
      .from(schema.executions)
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.sourceId, sourceId),
      ))
      .orderBy(desc(schema.executions.startedAt))
      .limit(20),
  ]);
  const tracedExecutionIds = await listExecutionIdsWithTraces(db, workspaceId, recentExecutions.map((exec) => exec.id));

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
    recentExecutions: recentExecutions.map((exec) => {
      return {
        id: exec.id,
        sourceId: exec.sourceId ?? null,
        fileId: exec.fileId ?? null,
        pipelineId: exec.pipelineId,
        status: exec.status,
        startedAt: exec.startedAt.toISOString(),
        completedAt: exec.completedAt?.toISOString() ?? null,
        versions: exec.versions,
        summary: exec.summary ?? null,
        hasGraph: tracedExecutionIds.has(exec.id),
        hasTraces: tracedExecutionIds.has(exec.id),
        error: exec.error ?? null,
      };
    }),
  } satisfies OverviewResponse;
});

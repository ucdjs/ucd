import type { OverviewResponse } from "@ucdjs/pipelines-ui/schemas";
import { schema } from "#server/db";
import { loadPipelineFileGroups } from "#server/lib/files";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { H3 } from "h3";

export const sourcesOverviewRouter: H3 = new H3();

// GET /api/sources/overview - Aggregated homepage data
sourcesOverviewRouter.get("/overview", async (event) => {
  const { sources, db, workspaceId } = event.context;

  if (!workspaceId) {
    return { error: "Workspace ID is required" };
  }

  const groups = await loadPipelineFileGroups(sources);

  const sourceStats = groups.map((group) => {
    const fileCount = group.fileGroups.length;
    const pipelineCount = group.fileGroups.reduce((sum, file) => sum + file.pipelines.length, 0);
    const errorCount = group.errors.length;

    return {
      id: group.sourceId,
      type: group.source.type,
      fileCount,
      pipelineCount,
      errorCount,
    };
  });

  const totalFiles = sourceStats.reduce((sum, source) => sum + source.fileCount, 0);
  const totalPipelines = sourceStats.reduce((sum, source) => sum + source.pipelineCount, 0);

  const totalExecutionsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.executions)
    .where(eq(schema.executions.workspaceId, workspaceId));
  const totalExecutions = Number(totalExecutionsResult[0]?.count ?? 0);

  const recentExecutions = await db.query.executions.findMany({
    where: eq(schema.executions.workspaceId, workspaceId),
    orderBy: desc(schema.executions.startedAt),
    limit: 10,
  });

  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date();
  const endDate = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  ));
  const startMs = endDate.getTime() - (6 * dayMs);
  const startDate = new Date(startMs);

  const activityExecutions = await db.query.executions.findMany({
    where: and(
      eq(schema.executions.workspaceId, workspaceId),
      gte(schema.executions.startedAt, startDate),
    ),
  });

  const activity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startMs + index * dayMs);
    return {
      date: date.toISOString().slice(0, 10),
      total: 0,
      success: 0,
      failed: 0,
    };
  });

  for (const exec of activityExecutions) {
    const execDate = exec.startedAt instanceof Date
      ? exec.startedAt
      : new Date(exec.startedAt);
    const dayIndex = Math.floor((execDate.getTime() - startMs) / dayMs);
    if (dayIndex < 0 || dayIndex >= activity.length) {
      continue;
    }
    const bucket = activity[dayIndex];
    if (!bucket) {
      continue;
    }
    bucket.total += 1;
    if (exec.status === "completed") {
      bucket.success += 1;
    } else if (exec.status === "failed") {
      bucket.failed += 1;
    }
  }

  return {
    stats: {
      totalSources: sources.length,
      totalFiles,
      totalPipelines,
      totalExecutions,
      sources: sourceStats,
    },
    activity,
    recentExecutions: recentExecutions.map((exec) => ({
      id: exec.id,
      pipelineId: exec.pipelineId,
      pipelineName: exec.pipelineId,
      status: exec.status,
      startedAt: exec.startedAt.toISOString(),
    })),
  } satisfies OverviewResponse;
});

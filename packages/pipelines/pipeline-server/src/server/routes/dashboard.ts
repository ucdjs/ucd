import type { Database } from "#server/db";
import { z } from "zod";
import { H3 } from "h3";

const DashboardStatsSchema = z.object({
  totalSources: z.number(),
  totalFiles: z.number(),
  totalPipelines: z.number(),
  totalExecutions: z.number(),
  sources: z.array(z.object({
    id: z.string(),
    type: z.string(),
    fileCount: z.number(),
    pipelineCount: z.number(),
    errorCount: z.number(),
  })),
});

const DailyExecutionSchema = z.object({
  date: z.string(),
  total: z.number(),
  success: z.number(),
  failed: z.number(),
});

const RecentExecutionSchema = z.object({
  id: z.string(),
  pipelineId: z.string(),
  pipelineName: z.string(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  startedAt: z.string(),
});

const DashboardResponseSchema = z.object({
  stats: DashboardStatsSchema,
  activity: z.array(DailyExecutionSchema),
  recentExecutions: z.array(RecentExecutionSchema),
});

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

export const dashboardRouter = new H3({ debug: true });

// GET /api/dashboard - Get aggregated dashboard data
dashboardRouter.get("/", async (event) => {
  const { sources, db } = event.context;
  const database = db as Database;

  // Calculate stats
  const totalSources = sources.length;
  let totalFiles = 0;
  let totalPipelines = 0;
  let totalErrors = 0;

  const sourceStats = sources.map((source) => {
    // This is simplified - in reality you'd fetch from DB
    const fileCount = 0;
    const pipelineCount = 0;
    const errorCount = 0;
    
    totalFiles += fileCount;
    totalPipelines += pipelineCount;
    totalErrors += errorCount;

    return {
      id: source.id,
      type: source.type,
      fileCount,
      pipelineCount,
      errorCount,
    };
  });

  // Get recent executions from database
  const recentExecutions = await database.query.executions.findMany({
    orderBy: (executions, { desc }) => [desc(executions.startedAt)],
    limit: 10,
  }).then(rows => rows.map(row => ({
    id: row.id,
    pipelineId: row.pipelineId,
    pipelineName: row.pipelineId, // TODO: join with pipeline table
    status: row.status as "pending" | "running" | "completed" | "failed" | "cancelled",
    startedAt: row.startedAt instanceof Date ? row.startedAt.toISOString() : String(row.startedAt),
  })));

  // Get activity data (last 7 days)
  const today = new Date();
  const activity = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split("T")[0],
      total: 0,
      success: 0,
      failed: 0,
    };
  });

  return {
    stats: {
      totalSources,
      totalFiles,
      totalPipelines,
      totalExecutions: recentExecutions.length,
      sources: sourceStats,
    },
    activity,
    recentExecutions,
  };
});

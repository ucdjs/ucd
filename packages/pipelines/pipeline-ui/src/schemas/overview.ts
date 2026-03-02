import { z } from "zod";
import { ExecutionSchema } from "./execution";

export const OverviewSourceSchema = z.object({
  id: z.string(),
  type: z.string(),
  fileCount: z.number(),
  pipelineCount: z.number(),
  errorCount: z.number(),
});
export type OverviewSource = z.infer<typeof OverviewSourceSchema>;

export const OverviewStatsSchema = z.object({
  totalSources: z.number(),
  totalFiles: z.number(),
  totalPipelines: z.number(),
  totalExecutions: z.number(),
  sources: z.array(OverviewSourceSchema),
});
export type OverviewStats = z.infer<typeof OverviewStatsSchema>;

export const OverviewActivitySchema = z.object({
  date: z.string(),
  total: z.number(),
  success: z.number(),
  failed: z.number(),
});
export type OverviewActivity = z.infer<typeof OverviewActivitySchema>;

export const OverviewExecutionSchema = ExecutionSchema.pick({
  id: true,
  pipelineId: true,
  status: true,
  startedAt: true,
}).extend({
  pipelineName: z.string(),
});
export type OverviewExecution = z.infer<typeof OverviewExecutionSchema>;

export const OverviewResponseSchema = z.object({
  stats: OverviewStatsSchema,
  activity: z.array(OverviewActivitySchema),
  recentExecutions: z.array(OverviewExecutionSchema),
});
export type OverviewResponse = z.infer<typeof OverviewResponseSchema>;

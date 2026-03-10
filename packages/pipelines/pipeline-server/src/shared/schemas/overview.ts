import z from "zod";
import { ExecutionSummaryItemSchema } from "./execution";

const OverviewStateCountsSchema = z.object({
  pending: z.number(),
  running: z.number(),
  completed: z.number(),
  failed: z.number(),
  cancelled: z.number(),
});

export const OverviewActivityDaySchema = OverviewStateCountsSchema.extend({
  date: z.string(),
});

export const OverviewExecutionSummarySchema = OverviewStateCountsSchema.extend({
  total: z.number(),
});

export const OverviewResponseSchema = z.object({
  activity: z.array(OverviewActivityDaySchema),
  summary: OverviewExecutionSummarySchema,
  recentExecutions: z.array(ExecutionSummaryItemSchema),
});

export type OverviewActivityDay = z.infer<typeof OverviewActivityDaySchema>;
export type OverviewExecutionSummary = z.infer<typeof OverviewExecutionSummarySchema>;
export type OverviewResponse = z.infer<typeof OverviewResponseSchema>;

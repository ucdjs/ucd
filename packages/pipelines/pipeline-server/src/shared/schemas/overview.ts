import z from "zod";
import { ExecutionSummaryItemSchema } from "./execution";

export const OverviewActivityDaySchema = z.object({
  date: z.string(),
  states: z.record(z.string(), z.number()),
});

export const OverviewExecutionSummarySchema = z.object({
  total: z.number(),
  states: z.record(z.string(), z.number()),
});

export const OverviewResponseSchema = z.object({
  activity: z.array(OverviewActivityDaySchema),
  summary: OverviewExecutionSummarySchema,
  recentExecutions: z.array(ExecutionSummaryItemSchema),
});

export type OverviewActivityDay = z.infer<typeof OverviewActivityDaySchema>;
export type OverviewExecutionSummary = z.infer<typeof OverviewExecutionSummarySchema>;
export type OverviewResponse = z.infer<typeof OverviewResponseSchema>;

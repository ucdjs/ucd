import type { PipelineEvent, PipelineEventType, PipelineGraph } from "@ucdjs/pipelines-core";
import type { ExecutionStatus, PipelineSummary } from "@ucdjs/pipelines-executor";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type ExecutionLogStream = "stdout" | "stderr";

export interface ExecutionLogPayload {
  message: string;
  stream: ExecutionLogStream;
  args?: unknown[];
  truncated?: boolean;
  originalSize?: number;
  event?: PipelineEvent;
}

export const executions = sqliteTable("executions", {
  id: text("id").primaryKey(),
  pipelineId: text("pipeline_id").notNull(),
  status: text("status").$type<ExecutionStatus>().notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  versions: text("versions", { mode: "json" }).$type<string[]>(),
  summary: text("summary", { mode: "json" }).$type<PipelineSummary>(),
  graph: text("graph", { mode: "json" }).$type<PipelineGraph>(),
  error: text("error"),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  executionId: text("execution_id").notNull()
    .references(() => executions.id, { onDelete: "cascade" }),
  type: text("type").$type<PipelineEventType>().notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  data: text("data", { mode: "json" }).$type<PipelineEvent>(),
});

export const executionLogs = sqliteTable("execution_logs", {
  id: text("id").primaryKey(),
  executionId: text("execution_id").notNull()
    .references(() => executions.id, { onDelete: "cascade" }),
  spanId: text("span_id"),
  stream: text("stream").$type<ExecutionLogStream>().notNull(),
  message: text("message").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  payload: text("payload", { mode: "json" }).$type<ExecutionLogPayload>(),
});

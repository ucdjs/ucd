import type { PipelineEvent, PipelineEventType, PipelineGraph } from "@ucdjs/pipelines-core";
import type { ExecutionStatus, PipelineSummary } from "@ucdjs/pipelines-executor";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type ExecutionLogStream = "stdout" | "stderr";

export interface ExecutionLogPayload {
  message: string;
  stream: ExecutionLogStream;
  args?: unknown[];
  truncated?: boolean;
  originalSize?: number;
  event?: PipelineEvent;
}

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  rootPath: text("root_path"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const executions = sqliteTable("executions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  pipelineId: text("pipeline_id").notNull(),
  status: text("status").$type<ExecutionStatus>().notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  versions: text("versions", { mode: "json" }).$type<string[]>(),
  summary: text("summary", { mode: "json" }).$type<PipelineSummary>(),
  graph: text("graph", { mode: "json" }).$type<PipelineGraph>(),
  error: text("error"),
}, (table) => [
  index("executions_workspace_pipeline_idx").on(table.workspaceId, table.pipelineId),
  index("executions_workspace_started_idx").on(table.workspaceId, table.startedAt),
]);

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  executionId: text("execution_id").notNull()
    .references(() => executions.id, { onDelete: "cascade" }),
  type: text("type").$type<PipelineEventType>().notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  data: text("data", { mode: "json" }).$type<PipelineEvent>(),
}, (table) => [
  index("events_workspace_execution_idx").on(table.workspaceId, table.executionId),
]);

export const executionLogs = sqliteTable("execution_logs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  executionId: text("execution_id").notNull()
    .references(() => executions.id, { onDelete: "cascade" }),
  spanId: text("span_id"),
  stream: text("stream").$type<ExecutionLogStream>().notNull(),
  message: text("message").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  payload: text("payload", { mode: "json" }).$type<ExecutionLogPayload>(),
}, (table) => [
  index("execution_logs_workspace_execution_idx").on(table.workspaceId, table.executionId),
  index("execution_logs_workspace_timestamp_idx").on(table.workspaceId, table.timestamp),
]);

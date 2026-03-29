import type {
  PipelineTraceKind,
  PipelineTraceRecord,
} from "@ucdjs/pipelines-core/tracing";
import type {
  ExecutionStatus,
  PipelineLogLevel,
  PipelineLogSource,
  PipelineSummary,
} from "@ucdjs/pipelines-executor";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export interface ExecutionLogPayload {
  message: string;
  args?: unknown[];
  level: PipelineLogLevel;
  source: PipelineLogSource;
  meta?: Record<string, unknown>;
  truncated?: boolean;
  originalSize?: number;
  isBanner?: boolean;
  traceKind?: string;
}

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  rootPath: text("root_path"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const executions = sqliteTable("executions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  sourceId: text("source_id"),
  fileId: text("file_id"),
  pipelineId: text("pipeline_id").notNull(),
  status: text("status").$type<ExecutionStatus>().notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  versions: text("versions", { mode: "json" }).$type<string[]>(),
  summary: text("summary", { mode: "json" }).$type<PipelineSummary>(),
  error: text("error"),
}, (table) => [
  index("executions_workspace_pipeline_idx").on(table.workspaceId, table.pipelineId),
  index("executions_workspace_started_idx").on(table.workspaceId, table.startedAt),
]);

export const executionTraces = sqliteTable("execution_traces", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  executionId: text("execution_id").notNull()
    .references(() => executions.id, { onDelete: "cascade" }),
  traceId: text("trace_id"),
  spanId: text("span_id"),
  parentSpanId: text("parent_span_id"),
  kind: text("kind").$type<PipelineTraceKind>().notNull(),
  startTimestamp: real("start_timestamp"),
  durationMs: real("duration_ms"),
  endTimestamp: integer("end_timestamp", { mode: "timestamp_ms" }).notNull(),
  data: text("data", { mode: "json" }).$type<PipelineTraceRecord>().notNull(),
}, (table) => [
  index("execution_traces_workspace_execution_idx").on(table.workspaceId, table.executionId),
  index("execution_traces_execution_start_idx").on(table.executionId, table.startTimestamp),
]);

export const executionLogs = sqliteTable("execution_logs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  executionId: text("execution_id").notNull()
    .references(() => executions.id, { onDelete: "cascade" }),
  spanId: text("span_id"),
  stream: text("stream"),
  message: text("message").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  payload: text("payload", { mode: "json" }).$type<ExecutionLogPayload>(),
}, (table) => [
  index("execution_logs_workspace_execution_idx").on(table.workspaceId, table.executionId),
  index("execution_logs_workspace_timestamp_idx").on(table.workspaceId, table.timestamp),
]);

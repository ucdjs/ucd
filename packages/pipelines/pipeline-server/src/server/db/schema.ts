import { int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const executions = sqliteTable("executions", {
  id: text("id").primaryKey(), // UUID
  pipelineId: text("pipeline_id").notNull(), // "ucd-16-0-0"
  status: text("status").notNull(), // "running" | "completed" | "failed"

  // Timestamps
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),

  // Execution data
  versions: text("versions", { mode: "json" }), // ["16.0.0", "15.1.0"]
  summary: text("summary", { mode: "json" }), // { totalRoutes: 10, cached: 5 }
  graph: text("graph", { mode: "json" }), // Full execution graph
  error: text("error"), // Error message if failed
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(), // Event UUID
  executionId: text("execution_id").notNull()
    .references(() => executions.id, { onDelete: "cascade" }),

  type: text("type").notNull(), // "route:start" | "route:end" | "error"
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),

  // Full event JSON - flexible schema for different event types
  data: text("data", { mode: "json" }),
});

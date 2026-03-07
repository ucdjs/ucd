import type { H3 } from "h3";
import type { PipelineSource } from "../../src/server/app";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { H3 as H3App } from "h3";
import { createApp } from "../../src/server/app";
import { createDatabase, runMigrations, schema, type Database } from "../../src/server/db";
import { ensureWorkspace } from "../../src/server/workspace";

const playgroundPath = fileURLToPath(new URL("../../../pipeline-playground/src", import.meta.url));
const defaultSources: PipelineSource[] = [{
  kind: "local",
  id: "local",
  path: playgroundPath,
}];

export async function createTestApp(options: { sources?: PipelineSource[] } = {}) {
  const db = createDatabase({ url: "file::memory:" });
  await runMigrations(db);
  await ensureWorkspace(db, "test", playgroundPath);

  const app = createApp({
    sources: options.sources ?? defaultSources,
    db,
    workspaceId: "test",
  });

  return { app, db, storePath: playgroundPath, workspaceId: "test" as const };
}

export async function createTestRoutesApp(routers: H3[], options: { sources?: PipelineSource[] } = {}) {
  const db = createDatabase({ url: "file::memory:" });
  await runMigrations(db);
  await ensureWorkspace(db, "test", playgroundPath);

  const app = new H3App({ debug: true });
  app.use("/**", (event, next) => {
    event.context.sources = options.sources ?? defaultSources;
    event.context.db = db;
    event.context.workspaceId = "test";
    next();
  });

  for (const router of routers) {
    app.mount("/api/sources", router);
  }

  return { app, db, storePath: playgroundPath, workspaceId: "test" as const };
}

export async function createTestExecution(app: H3) {
  const execRes = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/simple/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ versions: ["16.0.0"] }),
  }));

  const execData = await execRes.json();
  if (!execData.executionId) {
    throw new Error("Execution failed to start");
  }

  return execData.executionId as string;
}

interface SeedExecutionOptions {
  workspaceId?: string;
  pipelineId?: string;
  status?: "running" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date | null;
  versions?: string[] | null;
  summary?: typeof schema.executions.$inferInsert.summary;
  graph?: typeof schema.executions.$inferInsert.graph;
  error?: string | null;
}

export async function seedExecution(db: Database, options: SeedExecutionOptions = {}) {
  const executionId = randomUUID();

  await db.insert(schema.executions).values({
    id: executionId,
    workspaceId: options.workspaceId ?? "test",
    pipelineId: options.pipelineId ?? "simple",
    status: options.status ?? "completed",
    startedAt: options.startedAt ?? new Date("2026-01-01T00:00:00.000Z"),
    completedAt: options.completedAt ?? new Date("2026-01-01T00:00:05.000Z"),
    versions: options.versions ?? ["16.0.0"],
    summary: options.summary ?? null,
    graph: options.graph ?? null,
    error: options.error ?? null,
  });

  return executionId;
}

interface SeedExecutionEventOptions {
  executionId: string;
  workspaceId?: string;
  type?: string;
  timestamp?: Date;
  data?: typeof schema.events.$inferInsert.data;
}

export async function seedExecutionEvent(db: Database, options: SeedExecutionEventOptions) {
  await db.insert(schema.events).values({
    id: randomUUID(),
    workspaceId: options.workspaceId ?? "test",
    executionId: options.executionId,
    type: options.type as typeof schema.events.$inferInsert.type ?? "pipeline:start",
    timestamp: options.timestamp ?? new Date("2026-01-01T00:00:01.000Z"),
    data: options.data ?? ({
      type: "pipeline:start",
      timestamp: options.timestamp?.toISOString() ?? "2026-01-01T00:00:01.000Z",
      executionId: options.executionId,
      pipelineId: "simple",
      workspaceId: options.workspaceId ?? "test",
    } as never),
  });
}

interface SeedExecutionLogOptions {
  executionId: string;
  workspaceId?: string;
  spanId?: string | null;
  stream?: "stdout" | "stderr";
  message: string;
  timestamp?: Date;
  payload?: typeof schema.executionLogs.$inferInsert.payload;
}

export async function seedExecutionLog(db: Database, options: SeedExecutionLogOptions) {
  await db.insert(schema.executionLogs).values({
    id: randomUUID(),
    workspaceId: options.workspaceId ?? "test",
    executionId: options.executionId,
    spanId: options.spanId ?? null,
    stream: options.stream ?? "stdout",
    message: options.message,
    timestamp: options.timestamp ?? new Date("2026-01-01T00:00:02.000Z"),
    payload: options.payload ?? null,
  });
}

import type { PipelineSource } from "#server/app";
import type { Database } from "#server/db";
import type { H3 } from "h3";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createDatabase, runMigrations, schema } from "#server/db";
import { ensureWorkspace } from "#server/workspace";
import { H3 as H3App } from "h3";

const playgroundPath = fileURLToPath(new URL("../../../pipeline-playground/src", import.meta.url));
export const DEFAULT_DISCOVERABLE_FILE_ID = "simple~logging";
export const DEFAULT_DISCOVERABLE_PIPELINE_ID = "with-logging";
const defaultSources: PipelineSource[] = [{
  kind: "local",
  id: "local",
  path: playgroundPath,
}];

type ExecutionInsert = typeof schema.executions.$inferInsert;
type LogInsert = typeof schema.executionLogs.$inferInsert;
type TraceInsert = typeof schema.executionTraces.$inferInsert;

type SeedExecutionOptions = Partial<Omit<ExecutionInsert, "id">> & { id?: string };
type SeedExecutionLogOptions = Pick<LogInsert, "executionId" | "message"> & Partial<Omit<LogInsert, "id" | "executionId" | "message">>;
type SeedExecutionTraceOptions = Pick<TraceInsert, "executionId" | "kind" | "data"> & Partial<Omit<TraceInsert, "id" | "executionId" | "kind" | "data">>;

interface SeedExecutionInput extends SeedExecutionOptions {
  logs?: Omit<SeedExecutionLogOptions, "executionId">[];
  traces?: Omit<SeedExecutionTraceOptions, "executionId">[];
}

interface CreateTestRoutesAppOptions {
  sources?: PipelineSource[];
  seed?: {
    executions?: SeedExecutionInput[];
    logs?: SeedExecutionLogOptions[];
    traces?: SeedExecutionTraceOptions[];
  };
}

export async function createTestApp(options: { sources?: PipelineSource[] } = {}) {
  const { createApp } = await import("#server/app");
  const db = createDatabase({ url: ":memory:" });
  await runMigrations(db);
  await ensureWorkspace(db, "test", playgroundPath);

  const app = createApp({
    sources: options.sources ?? defaultSources,
    db,
    workspaceId: "test",
  });

  return { app, db, storePath: playgroundPath, workspaceId: "test" as const };
}

export async function createTestRoutesApp(routers: H3[], options: CreateTestRoutesAppOptions = {}) {
  const db = createDatabase({ url: ":memory:" });
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

  const executionIds: string[] = [];

  if (options.seed) {
    for (const execution of options.seed.executions ?? []) {
      const { logs, traces, ...executionOptions } = execution;
      const executionId = await seedExecution(db, executionOptions);
      executionIds.push(executionId);

      for (const log of logs ?? []) {
        await seedExecutionLog(db, {
          ...log,
          executionId,
        });
      }

      for (const trace of traces ?? []) {
        await seedExecutionTrace(db, {
          ...trace,
          executionId,
        });
      }
    }

    for (const log of options.seed.logs ?? []) {
      await seedExecutionLog(db, log);
    }

    for (const trace of options.seed.traces ?? []) {
      await seedExecutionTrace(db, trace);
    }
  }

  return {
    app,
    db,
    storePath: playgroundPath,
    workspaceId: "test" as const,
    seeded: {
      executionIds,
    },
  };
}

export async function createTestExecution(app: H3) {
  const execRes = await app.fetch(new Request(
    `http://localhost/api/sources/local/files/${DEFAULT_DISCOVERABLE_FILE_ID}/pipelines/${DEFAULT_DISCOVERABLE_PIPELINE_ID}/execute`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versions: ["16.0.0"] }),
    },
  ));

  const execData = await execRes.json();
  if (!execData.executionId) {
    throw new Error("Execution failed to start");
  }

  return execData.executionId as string;
}

export async function seedExecution(db: Database, options: SeedExecutionOptions = {}) {
  const executionId = options.id ?? randomUUID();

  await db.insert(schema.executions).values({
    id: executionId,
    workspaceId: options.workspaceId ?? "test",
    sourceId: options.sourceId ?? "local",
    fileId: options.fileId ?? "simple",
    pipelineId: options.pipelineId ?? "simple",
    status: options.status ?? "completed",
    startedAt: options.startedAt ?? new Date("2026-01-01T00:00:00.000Z"),
    completedAt: options.completedAt ?? new Date("2026-01-01T00:00:05.000Z"),
    versions: options.versions ?? ["16.0.0"],
    summary: options.summary ?? null,
    error: options.error ?? null,
  });

  return executionId;
}

export async function seedExecutionLog(db: Database, options: SeedExecutionLogOptions) {
  await db.insert(schema.executionLogs).values({
    id: randomUUID(),
    workspaceId: options.workspaceId ?? "test",
    executionId: options.executionId,
    spanId: options.spanId ?? null,
    message: options.message,
    timestamp: options.timestamp ?? new Date("2026-01-01T00:00:02.000Z"),
    payload: options.payload ?? null,
  });
}

export async function seedExecutionTrace(db: Database, options: SeedExecutionTraceOptions) {
  await db.insert(schema.executionTraces).values({
    id: randomUUID(),
    workspaceId: options.workspaceId ?? "test",
    executionId: options.executionId,
    traceId: options.traceId ?? null,
    spanId: options.spanId ?? null,
    parentSpanId: options.parentSpanId ?? null,
    kind: options.kind,
    startTimestamp: options.startTimestamp ?? null,
    durationMs: options.durationMs ?? null,
    endTimestamp: options.endTimestamp ?? new Date("2026-01-01T00:00:03.000Z"),
    data: options.data,
  });
}

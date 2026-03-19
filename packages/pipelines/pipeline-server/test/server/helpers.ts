import type { PipelineSource } from "#server/app";
import type { Database } from "#server/db";
import type { H3 } from "h3";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createDatabase, runMigrations, schema } from "#server/db";
import { ensureWorkspace } from "#server/workspace";
import { H3 as H3App } from "h3";

const playgroundPath = fileURLToPath(new URL("../../../pipeline-playground/src", import.meta.url));
const defaultSources: PipelineSource[] = [{
  kind: "local",
  id: "local",
  path: playgroundPath,
}];

type ExecutionInsert = typeof schema.executions.$inferInsert;
type EventInsert = typeof schema.events.$inferInsert;
type LogInsert = typeof schema.executionLogs.$inferInsert;

type SeedExecutionOptions = Partial<Omit<ExecutionInsert, "id">> & { id?: string };
type SeedExecutionEventOptions = Pick<EventInsert, "executionId"> & Partial<Omit<EventInsert, "id" | "executionId">>;
type SeedExecutionLogOptions = Pick<LogInsert, "executionId" | "message"> & Partial<Omit<LogInsert, "id" | "executionId" | "message">>;

interface SeedExecutionInput extends SeedExecutionOptions {
  events?: Omit<SeedExecutionEventOptions, "executionId">[];
  logs?: Omit<SeedExecutionLogOptions, "executionId">[];
}

interface CreateTestRoutesAppOptions {
  sources?: PipelineSource[];
  seed?: {
    executions?: SeedExecutionInput[];
    events?: SeedExecutionEventOptions[];
    logs?: SeedExecutionLogOptions[];
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
      const { events, logs, ...executionOptions } = execution;
      const executionId = await seedExecution(db, executionOptions);
      executionIds.push(executionId);

      for (const event of events ?? []) {
        await seedExecutionEvent(db, {
          ...event,
          executionId,
        });
      }

      for (const log of logs ?? []) {
        await seedExecutionLog(db, {
          ...log,
          executionId,
        });
      }
    }

    for (const event of options.seed.events ?? []) {
      await seedExecutionEvent(db, event);
    }

    for (const log of options.seed.logs ?? []) {
      await seedExecutionLog(db, log);
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
    graph: options.graph ?? null,
    error: options.error ?? null,
  });

  return executionId;
}

export async function seedExecutionEvent(db: Database, options: SeedExecutionEventOptions) {
  const eventType: EventInsert["type"] = options.type ?? "pipeline:start";

  await db.insert(schema.events).values({
    id: randomUUID(),
    workspaceId: options.workspaceId ?? "test",
    executionId: options.executionId,
    type: eventType,
    timestamp: options.timestamp ?? new Date("2026-01-01T00:00:01.000Z"),
    data: options.data,
  });
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

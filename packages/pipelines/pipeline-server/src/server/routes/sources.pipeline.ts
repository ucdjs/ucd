import type { ExecutePipelineResponse } from "#shared/schemas/execution";
import type { PipelineResponse as SourcePipelineResponse } from "#shared/schemas/pipeline";
import type { H3Event } from "h3";
import { randomUUID } from "node:crypto";
import { schema } from "#server/db";
import {
  hasExecutionTracesTable,
  isIgnorableExecutionTraceWriteError,
} from "#server/db/execution-traces";
import { createExecutionLogStore } from "#server/lib/execution-logs";
import { resolveSourceFiles } from "#server/lib/resolve";
import { ensureWorkspaceExists } from "#server/workspace";
import { toPipelineDetails } from "#shared/lib/pipeline-utils";
import { createPipelineExecutor } from "@ucdjs/pipelines-executor";
import { createNodeExecutionRuntime } from "@ucdjs/pipelines-executor/node";
import { and, eq } from "drizzle-orm";
import { H3, HTTPError, readValidatedBody } from "h3";
import { z } from "zod";

export const sourcesPipelineRouter: H3 = new H3();

const BASE = "/:sourceId/files/:fileId/pipelines/:pipelineId";

async function resolvePipelineRoute(event: H3Event) {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;
  const fileId = event.context.params?.fileId;
  const pipelineId = event.context.params?.pipelineId;

  if (!sourceId) {
    throw HTTPError.status(400, "Source ID is required");
  }

  if (!fileId) {
    throw HTTPError.status(400, "File ID is required");
  }

  if (!pipelineId) {
    throw HTTPError.status(400, "Pipeline ID is required");
  }

  const source = sources.find((source) => source.id === sourceId) ?? null;
  if (source == null) {
    throw HTTPError.status(404, `Source "${sourceId}" not found`);
  }

  const { files } = await resolveSourceFiles(source);
  const file = files.find((file) => file.id === fileId) ?? null;
  if (file == null) {
    throw HTTPError.status(404, `File "${fileId}" not found in source "${source.id}"`);
  }

  const pipeline = file.pipelines.find((pipeline) => pipeline.id === pipelineId) ?? null;
  if (pipeline == null) {
    throw HTTPError.status(404, `Pipeline "${pipelineId}" not found in file "${file.id}"`);
  }

  return { file, pipeline, pipelineId, source };
}

sourcesPipelineRouter.get(BASE, async (event) => {
  const { pipeline } = await resolvePipelineRoute(event);

  return {
    pipeline: toPipelineDetails(pipeline),
  } satisfies SourcePipelineResponse;
});

sourcesPipelineRouter.post(`${BASE}/execute`, async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const { file, pipeline, pipelineId, source } = await resolvePipelineRoute(event);

  const body = await readValidatedBody(event, z.object({
    versions: z.array(z.string()).optional(),
    cache: z.boolean().optional(),
  }));

  const versions = body.versions ?? pipeline.versions;
  const cache = body.cache ?? true;
  const executionId = randomUUID();
  const tracePersistenceEnabled = hasExecutionTracesTable(db);

  await ensureWorkspaceExists(db, workspaceId);

  await db.insert(schema.executions).values({
    id: executionId,
    workspaceId,
    sourceId: source.id,
    fileId: file.id,
    pipelineId,
    status: "running",
    startedAt: new Date(),
    versions,
  });

  const runtime = createNodeExecutionRuntime({
    outputCapture: {
      console: true,
      stdio: true,
    },
  });

  const executor = createPipelineExecutor({
    runtime,
    onEvent: async (evt) => {
      await db.insert(schema.events).values({
        id: randomUUID(),
        workspaceId,
        executionId,
        type: evt.type,
        timestamp: new Date(evt.timestamp),
        data: evt,
      });
    },
    onTrace: async (trace) => {
      if (!tracePersistenceEnabled) {
        return;
      }

      try {
        await db.insert(schema.executionTraces).values({
          id: trace.id,
          workspaceId,
          executionId,
          spanId: trace.spanId ?? null,
          kind: trace.kind,
          timestamp: new Date(trace.timestamp),
          data: trace,
        });
      } catch (error) {
        if (isIgnorableExecutionTraceWriteError(error)) {
          return;
        }

        throw error;
      }
    },
    onLog: createExecutionLogStore(db),
  });

  try {
    const execResult = await runtime.runWithExecutionContext({ executionId, workspaceId }, () =>
      executor.run([pipeline], { versions, cache }));

    const pipelineResult = execResult.find((r) => r.id === pipelineId);

    await db.update(schema.executions)
      .set({
        status: pipelineResult?.status ?? "failed",
        completedAt: new Date(),
        summary: pipelineResult?.summary ?? null,
      })
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ));

    return { success: true, executionId } satisfies ExecutePipelineResponse;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    await db.update(schema.executions)
      .set({ status: "failed", completedAt: new Date(), error: errorMessage })
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ));

    return { success: false, executionId, error: errorMessage } satisfies ExecutePipelineResponse;
  }
});

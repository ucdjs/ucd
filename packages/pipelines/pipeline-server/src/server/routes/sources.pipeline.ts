import type { ExecutePipelineResponse, SourcePipelineResponse } from "@ucdjs/pipelines-ui";
import type { H3Event } from "h3";
import { randomUUID } from "node:crypto";
import { schema } from "#server/db";
import { createExecutionLogStore } from "#server/lib/execution-logs";
import { resolveSourceFiles } from "#server/lib/resolve";
import { createPipelineExecutor, runWithPipelineExecutionContext } from "@ucdjs/pipelines-executor";
import { toPipelineDetails } from "@ucdjs/pipelines-ui";
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
  const { pipeline, pipelineId } = await resolvePipelineRoute(event);

  const body = await readValidatedBody(event, z.object({
    versions: z.array(z.string()).optional(),
    cache: z.boolean().optional(),
  }));

  const versions = body.versions ?? pipeline.versions;
  const cache = body.cache ?? true;
  const executionId = randomUUID();

  await db.insert(schema.executions).values({
    id: executionId,
    workspaceId,
    pipelineId,
    status: "running",
    startedAt: new Date(),
    versions,
  });

  const executor = createPipelineExecutor({
    capture: {
      console: true,
      stdio: true,
    },
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
    onLog: createExecutionLogStore(db),
  });

  try {
    const execResult = await runWithPipelineExecutionContext({ executionId, workspaceId }, () =>
      executor.run([pipeline], { versions, cache }));

    const pipelineResult = execResult.find((r) => r.id === pipelineId);

    await db.update(schema.executions)
      .set({
        status: pipelineResult?.status ?? "failed",
        completedAt: new Date(),
        summary: pipelineResult?.summary ?? null,
        graph: pipelineResult?.graph ?? null,
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

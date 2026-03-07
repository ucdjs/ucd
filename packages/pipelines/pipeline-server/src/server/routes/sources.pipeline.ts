import { randomUUID } from "node:crypto";
import { schema } from "#server/db";
import { createExecutionLogCapture } from "#server/lib/log-capture";
import { findPipelineInFile } from "#server/lib/lookup";
import { fileInfo, sourceInfo } from "#server/lib/resolve-params";
import { createPipelineExecutor, runWithPipelineExecutionContext } from "@ucdjs/pipelines-executor";
import { toPipelineDetails } from "@ucdjs/pipelines-ui";
import { and, eq } from "drizzle-orm";
import { H3, HTTPError, readValidatedBody } from "h3";
import { z } from "zod";

export const sourcesPipelineRouter: H3 = new H3();

const BASE = "/:sourceId/files/:fileId/pipelines/:pipelineId";

sourcesPipelineRouter.use(`${BASE}/**`, async (event, next) => {
  const { resolvedFile } = event.context;
  const pipelineId = event.context.params?.pipelineId;

  if (resolvedFile == null) {
    throw HTTPError.status(404, "File not found");
  }

  if (!pipelineId) {
    throw HTTPError.status(400, "Pipeline ID is required");
  }

  const entry = findPipelineInFile(resolvedFile.file.pipelines, pipelineId);
  if (!entry) {
    throw HTTPError.status(404, `Pipeline "${pipelineId}" not found in file "${resolvedFile.fileId}"`);
  }

  event.context.resolvedPipeline = {
    pipeline: entry.pipeline,
    pipelineId,
    exportName: entry.exportName,
  };

  return next();
});

sourcesPipelineRouter.get(BASE, async (event) => {
  const { resolvedSource, resolvedFile, resolvedPipeline } = event.context;

  if (resolvedSource == null) {
    throw HTTPError.status(404, "Source not found");
  }

  if (resolvedFile == null) {
    throw HTTPError.status(404, "File not found");
  }

  if (resolvedPipeline == null) {
    throw HTTPError.status(404, "Pipeline not found");
  }

  return {
    pipeline: toPipelineDetails(resolvedPipeline.pipeline),
    file: fileInfo(resolvedFile.file),
    source: sourceInfo(resolvedSource),
  };
});

sourcesPipelineRouter.post(`${BASE}/execute`, async (event) => {
  const { resolvedSource, resolvedPipeline } = event.context;
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;

  if (resolvedSource == null) {
    throw HTTPError.status(404, "Source not found");
  }

  if (resolvedPipeline == null) {
    throw HTTPError.status(404, "Pipeline not found");
  }

  const source = resolvedSource;
  const pipelineId = resolvedPipeline.pipelineId;
  const pipeline = resolvedPipeline.pipeline;

  if (source.type !== "local") {
    throw HTTPError.status(400, "Pipeline execution is only allowed for local sources");
  }

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

  const logCapture = createExecutionLogCapture(db);
  logCapture.start();

  const executor = createPipelineExecutor({
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

    return { success: true, executionId };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    await db.update(schema.executions)
      .set({ status: "failed", completedAt: new Date(), error: errorMessage })
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ));

    return { success: false, executionId, error: errorMessage };
  } finally {
    await logCapture.stop();
  }
});

import { randomUUID } from "node:crypto";
import { schema } from "#server/db";
import { createExecutionLogCapture } from "#server/lib/log-capture";
import { createPipelineExecutor, runWithPipelineExecutionContext } from "@ucdjs/pipelines-executor";
import { and, desc, eq, sql } from "drizzle-orm";
import { getQuery, H3, readValidatedBody } from "h3";
import { z } from "zod";
import { findPipelineByFileId } from "../lib/files";

export const sourcesPipelineRouter: H3 = new H3();

sourcesPipelineRouter.post("/:sourceId/:fileId/:pipelineId/execute", async (event) => {
  const { sources, db } = event.context;
  const workspaceId = event.context.workspaceId;
  const sourceId = event.context.params?.sourceId;
  const fileId = event.context.params?.fileId;
  const pipelineId = event.context.params?.pipelineId;

  if (!sourceId || !fileId || !pipelineId || !workspaceId) {
    return { error: "Source ID, File ID, Pipeline ID, and workspace ID are required" };
  }

  // Only allow execution from local sources for security
  const localSources = sources.filter((s) => s.type === "local" && s.id === sourceId);

  if (localSources.length === 0) {
    return { error: "Pipeline execution is only allowed from local sources" };
  }

  const body = await readValidatedBody(event, z.object({
    versions: z.array(z.string()).optional(),
    cache: z.boolean().optional(),
  }));

  const group = await event.context.getSourceData(sourceId);
  if (!group) {
    return { error: `Source "${sourceId}" not found` };
  }

  const match = findPipelineByFileId(fileId, group.fileGroups, pipelineId);
  if (!match) {
    return { error: `Pipeline "${pipelineId}" not found in file "${fileId}" of source "${sourceId}"` };
  }

  const pipeline = match.entry.pipeline;
  const versions = body.versions ?? pipeline.versions;
  const cache = body.cache ?? true;

  const executionId = randomUUID();
  const startedAt = new Date();

  await db.insert(schema.executions).values({
    id: executionId,
    workspaceId,
    pipelineId,
    status: "running",
    startedAt,
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
    const execResult = await runWithPipelineExecutionContext({ executionId, workspaceId }, async () => {
      return executor.run([pipeline], {
        versions,
        cache,
      });
    });

    const pipelineResult = execResult.find((result) => result.id === pipelineId);
    const completedAt = new Date();

    await db.update(schema.executions)
      .set({
        status: pipelineResult?.status ?? "failed",
        completedAt,
        summary: pipelineResult?.summary ?? null,
        graph: pipelineResult?.graph ?? null,
      })
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ));

    return {
      success: true,
      executionId,
    };
  } catch (err) {
    const completedAt = new Date();
    const errorMessage = err instanceof Error ? err.message : String(err);

    await db.update(schema.executions)
      .set({
        status: "failed",
        completedAt,
        error: errorMessage,
      })
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ));

    return {
      success: false,
      executionId,
      error: errorMessage,
    };
  } finally {
    await logCapture.stop();
  }
});

sourcesPipelineRouter.get("/:sourceId/:fileId/:pipelineId/executions", async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const pipelineId = event.context.params?.pipelineId;

  if (!pipelineId || !workspaceId) {
    return { error: "Pipeline ID and workspace ID are required" };
  }

  const query = getQuery(event);
  const limit = Math.min(
    typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 50,
    100,
  );
  const offset = typeof query.offset === "string" ? Number.parseInt(query.offset, 10) : 0;

  try {
    const executions = await db.query.executions.findMany({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.pipelineId, pipelineId),
      ),
      orderBy: desc(schema.executions.startedAt),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.executions)
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.pipelineId, pipelineId),
      ));
    const total = Number(countResult[0]?.count ?? 0);

    return {
      executions: executions.map((exec) => ({
        id: exec.id,
        pipelineId: exec.pipelineId,
        status: exec.status,
        startedAt: exec.startedAt.toISOString(),
        completedAt: exec.completedAt?.toISOString() ?? null,
        versions: exec.versions,
        summary: exec.summary,
        hasGraph: Boolean(exec.graph),
        error: exec.error,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (err) {
    console.error("Failed to fetch executions:", err);
    return {
      error: "Failed to fetch executions",
      details: err instanceof Error ? err.message : String(err),
    };
  }
});

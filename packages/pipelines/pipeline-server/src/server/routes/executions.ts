import type { PipelineExecutionList } from "#queries/execution";
import { schema } from "#server/db";
import { listExecutionIdsWithTraces } from "#server/db/execution-traces";
import { and, desc, eq, sql } from "drizzle-orm";
import { getValidatedQuery, H3 } from "h3";
import z from "zod";

export const sourcesExecutionsRouter: H3 = new H3();

sourcesExecutionsRouter.get("/:sourceId/files/:fileId/pipelines/:pipelineId/executions", async (event) => {
  const { db, workspaceId } = event.context;
  const { sourceId, fileId, pipelineId } = event.context.params! as {
    sourceId: string;
    fileId: string;
    pipelineId: string;
  };

  const { limit, offset } = await getValidatedQuery(event, z.object({
    limit: z.coerce.number().min(1).max(100).catch(50),
    offset: z.coerce.number().min(0).catch(0),
  }));

  const where = and(
    eq(schema.executions.workspaceId, workspaceId),
    eq(schema.executions.sourceId, sourceId),
    eq(schema.executions.fileId, fileId),
    eq(schema.executions.pipelineId, pipelineId),
  );

  const [executions, [countResult]] = await Promise.all([
    db
      .select()
      .from(schema.executions)
      .where(where)
      .orderBy(desc(schema.executions.startedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.executions)
      .where(where),
  ]);

  const total = Number(countResult?.count ?? 0);
  const tracedExecutionIds = await listExecutionIdsWithTraces(db, workspaceId, executions.map((exec) => exec.id));

  return {
    executions: executions.map((exec) => ({
      id: exec.id,
      sourceId: exec.sourceId ?? null,
      fileId: exec.fileId ?? null,
      pipelineId: exec.pipelineId,
      status: exec.status,
      startedAt: exec.startedAt.toISOString(),
      completedAt: exec.completedAt?.toISOString() ?? null,
      versions: exec.versions,
      summary: exec.summary ?? null,
      hasGraph: tracedExecutionIds.has(exec.id),
      hasTraces: tracedExecutionIds.has(exec.id),
      error: exec.error ?? null,
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  } satisfies PipelineExecutionList;
});

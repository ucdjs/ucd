import type { ExecutionsResponse } from "#shared/schemas/execution";
import { schema } from "#server/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { getQuery, H3 } from "h3";

export const sourcesExecutionsRouter: H3 = new H3();

sourcesExecutionsRouter.get("/:sourceId/files/:fileId/pipelines/:pipelineId/executions", async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const sourceId = event.context.params!.sourceId!;
  const fileId = event.context.params!.fileId!;
  const pipelineId = event.context.params!.pipelineId!;

  const query = getQuery(event);
  const parsedLimit = typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 50;
  const parsedOffset = typeof query.offset === "string" ? Number.parseInt(query.offset, 10) : 0;
  const limit = Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 50, 100);
  const offset = Number.isFinite(parsedOffset) ? parsedOffset : 0;

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
      hasGraph: Boolean(exec.graph),
      error: exec.error ?? null,
    })),
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  } satisfies ExecutionsResponse;
});

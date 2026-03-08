import { schema } from "#server/db";
import type { ExecutionsResponse } from "@ucdjs/pipelines-ui";
import { and, desc, eq, sql } from "drizzle-orm";
import { getQuery, H3 } from "h3";

export const sourcesExecutionsRouter: H3 = new H3();

sourcesExecutionsRouter.get("/:sourceId/files/:fileId/pipelines/:pipelineId/executions", async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const pipelineId = event.context.params!.pipelineId!;

  const query = getQuery(event);
  const limit = Math.min(
    typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 50,
    100,
  );
  const offset = typeof query.offset === "string" ? Number.parseInt(query.offset, 10) : 0;

  const where = and(
    eq(schema.executions.workspaceId, workspaceId),
    eq(schema.executions.pipelineId, pipelineId),
  );

  const [executions, countResult] = await Promise.all([
    db.query.executions.findMany({
      where,
      orderBy: desc(schema.executions.startedAt),
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)` }).from(schema.executions).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    executions: executions.map((exec) => ({
      id: exec.id,
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

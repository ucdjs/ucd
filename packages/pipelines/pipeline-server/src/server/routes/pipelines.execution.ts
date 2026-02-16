import { schema } from "#server/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { getQuery, H3 } from "h3";

export const pipelinesExecutionRouter: H3 = new H3();

pipelinesExecutionRouter.get("/:file/:id/executions", async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const id = event.context.params?.id;

  if (!id) {
    return { error: "Pipeline ID is required" };
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
        eq(schema.executions.pipelineId, id),
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
        eq(schema.executions.pipelineId, id),
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

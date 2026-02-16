import { schema } from "#server/db";
import { and, asc, eq, sql } from "drizzle-orm";
import { getQuery, H3 } from "h3";

export const pipelinesEventsRouter: H3 = new H3();

pipelinesEventsRouter.get("/:file/:id/executions/:executionId/events", async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const executionId = event.context.params?.executionId;

  if (!executionId) {
    return { error: "Execution ID is required" };
  }

  const query = getQuery(event);
  const limit = Math.min(
    typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 100,
    500,
  );
  const offset = typeof query.offset === "string" ? Number.parseInt(query.offset, 10) : 0;

  try {
    const execution = await db.query.executions.findFirst({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ),
      columns: { id: true, pipelineId: true, status: true },
    });

    if (!execution) {
      return { error: `Execution "${executionId}" not found` };
    }

    const events = await db.query.events.findMany({
      where: and(
        eq(schema.events.workspaceId, workspaceId),
        eq(schema.events.executionId, executionId),
      ),
      orderBy: asc(schema.events.timestamp),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.events)
      .where(and(
        eq(schema.events.workspaceId, workspaceId),
        eq(schema.events.executionId, executionId),
      ));
    const total = Number(countResult[0]?.count ?? 0);

    return {
      executionId,
      pipelineId: execution.pipelineId,
      status: execution.status,
      events: events.map((evt) => ({
        id: evt.id,
        type: evt.type,
        timestamp: evt.timestamp.toISOString(),
        data: evt.data,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (err) {
    console.error("Failed to fetch events:", err);
    return {
      error: "Failed to fetch events",
      details: err instanceof Error ? err.message : String(err),
    };
  }
});

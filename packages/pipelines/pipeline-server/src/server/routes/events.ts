import { H3, getQuery } from "h3";
import { asc, eq } from "drizzle-orm";
import * as schema from "../db/schema";

export const eventsRouter = new H3();

// GET /api/executions/:id/events?limit=100&offset=0
eventsRouter.get("/", async (event) => {
  const { db } = event.context;
  const executionId = event.context.params?.id;

  if (!executionId) {
    return { error: "Execution ID is required" };
  }

  const query = getQuery(event);
  const limit = Math.min(
    typeof query.limit === "string" ? parseInt(query.limit, 10) : 100,
    500 // Max limit of 500
  );
  const offset = typeof query.offset === "string" ? parseInt(query.offset, 10) : 0;

  try {
    // Get the execution to verify it exists
    const execution = await db.query.executions.findFirst({
      where: eq(schema.executions.id, executionId),
      columns: { id: true, pipelineId: true, status: true },
    });

    if (!execution) {
      return { error: `Execution "${executionId}" not found` };
    }

    // Get events for this execution, ordered by timestamp asc
    const events = await db.query.events.findMany({
      where: eq(schema.events.executionId, executionId),
      orderBy: asc(schema.events.timestamp),
      limit,
      offset,
    });

    // Get total count for pagination info
    const countResult = await db.query.events.findMany({
      where: eq(schema.events.executionId, executionId),
      columns: { id: true },
    });
    const total = countResult.length;

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

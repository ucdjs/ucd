import { schema } from "#server/db";
import { and, asc, eq } from "drizzle-orm";
import { getQuery, H3 } from "h3";

export const pipelinesLogsRouter = new H3();

pipelinesLogsRouter.get("/:file/:id/executions/:executionId/logs", async (event) => {
  const { db } = event.context;
  const executionId = event.context.params?.executionId;

  if (!executionId) {
    return { error: "Execution ID is required" };
  }

  const query = getQuery(event);
  const limit = Math.min(
    typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 200,
    1000,
  );
  const offset = typeof query.offset === "string" ? Number.parseInt(query.offset, 10) : 0;
  const spanId = typeof query.spanId === "string" ? query.spanId : undefined;

  try {
    const execution = await db.query.executions.findFirst({
      where: eq(schema.executions.id, executionId),
      columns: { id: true, pipelineId: true, status: true },
    });

    if (!execution) {
      return { error: `Execution "${executionId}" not found` };
    }

    const whereClause = spanId
      ? and(eq(schema.executionLogs.executionId, executionId), eq(schema.executionLogs.spanId, spanId))
      : eq(schema.executionLogs.executionId, executionId);

    const logs = await db.query.executionLogs.findMany({
      where: whereClause,
      orderBy: asc(schema.executionLogs.timestamp),
      limit,
      offset,
    });

    const allLogs = await db.query.executionLogs.findMany({
      where: whereClause,
      columns: { message: true, payload: true },
    });

    const total = allLogs.length;
    const capturedSize = allLogs.reduce((sum, log) => sum + Buffer.byteLength(log.message, "utf-8"), 0);
    const truncated = allLogs.some((log) => Boolean(log.payload?.truncated));
    const originalSize = allLogs.reduce((max, log) => {
      const value = log.payload?.originalSize ?? 0;
      return value > max ? value : max;
    }, 0);

    return {
      executionId,
      pipelineId: execution.pipelineId,
      status: execution.status,
      logs: logs.map((log) => ({
        id: log.id,
        spanId: log.spanId,
        stream: log.stream,
        message: log.message,
        timestamp: log.timestamp.toISOString(),
        payload: log.payload,
      })),
      truncated,
      capturedSize,
      originalSize: originalSize > 0 ? originalSize : null,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (err) {
    console.error("Failed to fetch logs:", err);
    return {
      error: "Failed to fetch logs",
      details: err instanceof Error ? err.message : String(err),
    };
  }
});

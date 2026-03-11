import type { ExecutionLogsResponse } from "#shared/schemas/execution";
import { Buffer } from "node:buffer";
import { schema } from "#server/db";
import { and, asc, eq } from "drizzle-orm";
import { getQuery, H3, HTTPError } from "h3";

export const sourcesLogsRouter: H3 = new H3();

sourcesLogsRouter.get(
  "/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/logs",
  async (event) => {
    const { db } = event.context;
    const workspaceId = event.context.workspaceId;
    const sourceId = event.context.params!.sourceId!;
    const fileId = event.context.params!.fileId!;
    const pipelineId = event.context.params!.pipelineId!;
    const executionId = event.context.params?.executionId;
    if (!executionId) {
      throw HTTPError.status(400, "Execution ID is required");
    }

    const query = getQuery(event);
    const parsedLimit = typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 200;
    const parsedOffset = typeof query.offset === "string" ? Number.parseInt(query.offset, 10) : 0;
    const limit = Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 200, 1000);
    const offset = Number.isFinite(parsedOffset) ? parsedOffset : 0;
    const spanId = typeof query.spanId === "string" ? query.spanId : undefined;

    const execution = await db.query.executions.findFirst({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.sourceId, sourceId),
        eq(schema.executions.fileId, fileId),
        eq(schema.executions.pipelineId, pipelineId),
        eq(schema.executions.id, executionId),
      ),
      columns: { id: true, pipelineId: true, status: true },
    });

    if (!execution) {
      throw HTTPError.status(404, `Execution "${executionId}" not found`);
    }

    const where = spanId
      ? and(
          eq(schema.executionLogs.workspaceId, workspaceId),
          eq(schema.executionLogs.executionId, executionId),
          eq(schema.executionLogs.spanId, spanId),
        )
      : and(
          eq(schema.executionLogs.workspaceId, workspaceId),
          eq(schema.executionLogs.executionId, executionId),
        );

    const [logs, allLogs] = await Promise.all([
      db.query.executionLogs.findMany({
        where,
        orderBy: asc(schema.executionLogs.timestamp),
        limit,
        offset,
      }),
      db.query.executionLogs.findMany({
        where,
        columns: { message: true, payload: true },
      }),
    ]);

    const total = allLogs.length;
    const capturedSize = allLogs.reduce((sum, log) => sum + Buffer.byteLength(log.message, "utf-8"), 0);
    const truncated = allLogs.some((log) => Boolean(log.payload?.truncated));
    const originalSize = allLogs.reduce((max, log) => Math.max(max, log.payload?.originalSize ?? 0), 0);

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
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    } satisfies ExecutionLogsResponse;
  },
);

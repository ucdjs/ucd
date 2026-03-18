import type { ExecutionLogsResponse } from "#shared/schemas/execution";
import { schema } from "#server/db";
import { and, asc, eq, sql } from "drizzle-orm";
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

    const [logs, aggregates] = await Promise.all([
      db.query.executionLogs.findMany({
        where,
        orderBy: asc(schema.executionLogs.timestamp),
        limit,
        offset,
      }),
      db
        .select({
          total: sql<number>`count(*)`,
          // length() returns character count (approx bytes for ASCII-dominant log output)
          capturedSize: sql<number>`coalesce(sum(length(${schema.executionLogs.message})), 0)`,
          hasTruncated: sql<number>`max(coalesce(cast(json_extract(${schema.executionLogs.payload}, '$.truncated') as integer), 0))`,
          maxOriginalSize: sql<number>`max(cast(json_extract(${schema.executionLogs.payload}, '$.originalSize') as integer))`,
        })
        .from(schema.executionLogs)
        .where(where),
    ]);

    const agg = aggregates[0];
    const total = Number(agg?.total ?? 0);
    const capturedSize = Number(agg?.capturedSize ?? 0);
    const truncated = (Number(agg?.hasTruncated) ?? 0) > 0;
    const originalSize = Number(agg?.maxOriginalSize ?? 0);

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

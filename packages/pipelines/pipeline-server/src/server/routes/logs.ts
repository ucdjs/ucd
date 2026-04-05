import type { PipelineExecutionLogList } from "#shared/schemas/execution";
import { schema } from "#server/db";
import { and, asc, eq, sql } from "drizzle-orm";
import { getQuery, getValidatedQuery, H3, HTTPError } from "h3";
import z from "zod";

export const sourcesLogsRouter: H3 = new H3();

sourcesLogsRouter.get(
  "/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/logs",
  async (event) => {
    const { db, workspaceId } = event.context;
    const { sourceId, fileId, pipelineId, executionId } = event.context.params as {
      sourceId: string;
      fileId: string;
      pipelineId: string;
      executionId?: string;
    };

    if (!executionId) {
      throw HTTPError.status(400, "Execution ID is required");
    }

    const { limit, offset, spanId } = await getValidatedQuery(event, z.object({
      limit: z.coerce.number().min(1).max(1000).catch(200),
      offset: z.coerce.number().min(0).catch(0),
      spanId: z.string().optional(),
    }));

    const [execution] = await db
      .select({
        id: schema.executions.id,
        pipelineId: schema.executions.pipelineId,
        status: schema.executions.status,
      })
      .from(schema.executions)
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.sourceId, sourceId),
        eq(schema.executions.fileId, fileId),
        eq(schema.executions.pipelineId, pipelineId),
        eq(schema.executions.id, executionId),
      ))
      .limit(1);

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

    const MAX_PAGE_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
    // Sample this many rows to estimate average payload size without a full scan.
    const PAYLOAD_SAMPLE_SIZE = 100;

    const timerLabel = `logs[${executionId.slice(0, 8)}]`;

    // Phase 1: single-query safety check.
    //   Reads at most PAYLOAD_SAMPLE_SIZE rows to estimate average payload size.
    //   count(*) here counts sampled rows (≤ PAYLOAD_SAMPLE_SIZE), not the full table -
    //   so this never does a full scan regardless of how many rows exist.
    //   total for pagination is computed in Phase 2 alongside the other aggregates.
    // eslint-disable-next-line no-console
    console.time(`${timerLabel} safety-check`);
    const payloadSample = db
      .select({ payload: schema.executionLogs.payload })
      .from(schema.executionLogs)
      .where(where)
      .limit(PAYLOAD_SAMPLE_SIZE)
      .as("payload_sample");

    const sampleRows = await db
      .select({
        sampleCount: sql<number>`count(*)`,
        samplePayloadSize: sql<number>`coalesce(sum(length(${payloadSample.payload})), 0)`,
      })
      .from(payloadSample);
    // eslint-disable-next-line no-console
    console.timeEnd(`${timerLabel} safety-check`);

    const sampleCount = Number(sampleRows[0]?.sampleCount ?? 0);
    const samplePayloadSize = Number(sampleRows[0]?.samplePayloadSize ?? 0);
    // If we got fewer rows than PAYLOAD_SAMPLE_SIZE, we've seen every row -
    // use the actual total directly instead of extrapolating to `limit`.
    const estimatedPagePayloadSize = sampleCount < PAYLOAD_SAMPLE_SIZE
      ? samplePayloadSize
      : Math.ceil((samplePayloadSize / sampleCount) * limit);

    if (estimatedPagePayloadSize > MAX_PAGE_PAYLOAD_BYTES) {
      throw HTTPError.status(
        413,
        `Log payloads are too large to load (estimated ${Math.round(estimatedPagePayloadSize / 1024 / 1024)} MB for this page). `
        + "This may be caused by a logging feedback loop during execution.",
      );
    }

    // Phase 2: metadata aggregate + row fetch in parallel.
    // eslint-disable-next-line no-console
    console.time(`${timerLabel} fetch (limit=${limit} offset=${offset})`);
    const [aggregates, logs] = await Promise.all([
      db.select({
        total: sql<number>`count(*)`,
        // length() returns character count (approx bytes for ASCII-dominant log output)
        capturedSize: sql<number>`coalesce(sum(length(${schema.executionLogs.message})), 0)`,
        hasTruncated: sql<number>`max(coalesce(cast(json_extract(${schema.executionLogs.payload}, '$.truncated') as integer), 0))`,
        maxOriginalSize: sql<number>`max(cast(json_extract(${schema.executionLogs.payload}, '$.originalSize') as integer))`,
      })
        .from(schema.executionLogs)
        .where(where),
      db
        .select()
        .from(schema.executionLogs)
        .where(where)
        .orderBy(asc(schema.executionLogs.timestamp))
        .limit(limit)
        .offset(offset),
    ]);
    // eslint-disable-next-line no-console
    console.timeEnd(`${timerLabel} fetch (limit=${limit} offset=${offset})`);

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
        message: log.message,
        timestamp: log.timestamp.toISOString(),
        level: log.level ?? null,
        source: log.source ?? null,
        payload: log.payload,
      })),
      truncated,
      capturedSize,
      originalSize: originalSize > 0 ? originalSize : null,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    } satisfies PipelineExecutionLogList;
  },
);

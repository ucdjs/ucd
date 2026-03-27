import type { ExecutionTracesResponse } from "#shared/schemas/execution";
import { schema } from "#server/db";
import { hasExecutionTracesTable } from "#server/db/execution-traces";
import { buildOutputManifestFromTraces } from "@ucdjs/pipelines-core";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getQuery, H3, HTTPError } from "h3";

export const sourcesTracesRouter: H3 = new H3();

sourcesTracesRouter.get(
  "/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/traces",
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
    const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 200, 1), 1000);
    const offset = Math.max(Number.isFinite(parsedOffset) ? parsedOffset : 0, 0);

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

    if (!hasExecutionTracesTable(db)) {
      return {
        executionId: execution.id,
        pipelineId: execution.pipelineId,
        status: execution.status,
        traces: [],
        outputManifest: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      } satisfies ExecutionTracesResponse;
    }

    const traceWhere = and(
      eq(schema.executionTraces.workspaceId, workspaceId),
      eq(schema.executionTraces.executionId, executionId),
    );

    const [traceRows, allTraceRows, [countResult]] = await Promise.all([
      db
        .select()
        .from(schema.executionTraces)
        .where(traceWhere)
        .orderBy(asc(schema.executionTraces.timestamp), asc(schema.executionTraces.id))
        .limit(limit)
        .offset(offset),
      db
        .select()
        .from(schema.executionTraces)
        .where(and(traceWhere, inArray(schema.executionTraces.kind, ["output.resolved", "output.written"]))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.executionTraces)
        .where(traceWhere),
    ]);

    const traces = traceRows.map((trace) => ({
      id: trace.id,
      kind: trace.kind,
      traceId: trace.traceId ?? null,
      spanId: trace.spanId ?? null,
      parentSpanId: trace.parentSpanId ?? null,
      timestamp: trace.timestamp.toISOString(),
      data: trace.data,
    }));

    const outputManifest = buildOutputManifestFromTraces(allTraceRows.map((trace) => trace.data));

    const total = Number(countResult?.count ?? 0);

    return {
      executionId: execution.id,
      pipelineId: execution.pipelineId,
      status: execution.status,
      traces,
      outputManifest,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    } satisfies ExecutionTracesResponse;
  },
);

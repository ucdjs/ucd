import type { ExecutionTracesResponse } from "#shared/schemas/execution";
import { schema } from "#server/db";
import { buildOutputManifestFromTraces } from "@ucdjs/pipelines-core/tracing";
import { and, asc, eq, sql } from "drizzle-orm";
import { H3, HTTPError } from "h3";

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

    const allRows = await db
      .select()
      .from(schema.executionTraces)
      .where(and(
        eq(schema.executionTraces.workspaceId, workspaceId),
        eq(schema.executionTraces.executionId, executionId),
      ))
      .orderBy(
        sql`start_timestamp ASC NULLS LAST`,
        asc(schema.executionTraces.endTimestamp),
        asc(schema.executionTraces.id),
      );

    // Spans: own startTimestamp. Events: startTimestamp IS NULL (borrow parent's spanId).
    const spanRows = allRows.filter((r) => r.startTimestamp != null);
    const eventRows = allRows.filter((r) => r.startTimestamp == null);

    // Group events by their spanId (= the parent span's spanId)
    const eventsBySpanId = new Map<string, typeof eventRows>();
    for (const ev of eventRows) {
      if (!ev.spanId) continue;
      const list = eventsBySpanId.get(ev.spanId) ?? [];
      list.push(ev);
      eventsBySpanId.set(ev.spanId, list);
    }

    // Root pipeline span carries trace-level metadata
    const rootSpan = spanRows.find((r) => r.kind === "pipeline");

    // Output manifest from output.resolved spans + output.written events
    const manifestRows = allRows.filter(
      (r) => r.kind === "output.resolved" || r.kind === "output.written",
    );
    const outputManifest = buildOutputManifestFromTraces(manifestRows.map((r) => r.data));

    const BASE_KEYS = new Set([
      "id",
      "kind",
      "pipelineId",
      "traceId",
      "spanId",
      "parentSpanId",
      "timestamp",
      "schemaVersion",
      "startTimestamp",
      "durationMs",
    ]);

    function stripBaseFields(data: unknown): unknown {
      if (data == null || typeof data !== "object") return data;
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
        if (!BASE_KEYS.has(k)) result[k] = v;
      }
      return result;
    }

    const spans = spanRows.map((row) => {
      const spanEvents = eventsBySpanId.get(row.spanId ?? "") ?? [];
      return {
        id: row.id,
        spanId: row.spanId ?? null,
        parentSpanId: row.parentSpanId ?? null,
        kind: row.kind,
        startTimestamp: row.startTimestamp ?? null,
        durationMs: row.durationMs ?? null,
        attributes: stripBaseFields(row.data),
        events: spanEvents.map((ev) => ({
          timestamp: ev.endTimestamp.getTime(),
          kind: ev.kind,
          attributes: stripBaseFields(ev.data),
        })),
      };
    });

    return {
      executionId: execution.id,
      pipelineId: execution.pipelineId,
      status: execution.status,
      traceId: rootSpan?.traceId ?? null,
      startTimestamp: rootSpan?.startTimestamp ?? null,
      durationMs: rootSpan?.durationMs ?? null,
      spans,
      outputManifest,
    } satisfies ExecutionTracesResponse;
  },
);

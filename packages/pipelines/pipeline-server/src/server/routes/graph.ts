import type { PipelineExecutionGraphResult } from "#shared/schemas/execution";
import { schema } from "#server/db";
import { buildExecutionGraphView } from "#shared/lib/graph";
import { buildExecutionGraphFromTraces } from "@ucdjs/pipeline-executor/graph";
import { and, eq } from "drizzle-orm";
import { H3, HTTPError } from "h3";

export const sourcesGraphRouter: H3 = new H3();

sourcesGraphRouter.get(
  "/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/graph",
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

    const traceRows = await db
      .select({ data: schema.executionTraces.data })
      .from(schema.executionTraces)
      .where(and(
        eq(schema.executionTraces.workspaceId, workspaceId),
        eq(schema.executionTraces.executionId, executionId),
      ))
      .orderBy(schema.executionTraces.endTimestamp);

    const graph = traceRows.length > 0
      ? buildExecutionGraphFromTraces(traceRows.map((trace) => trace.data))
      : null;

    return {
      executionId: execution.id,
      pipelineId: execution.pipelineId,
      status: execution.status,
      graph: graph
        ? buildExecutionGraphView(graph, {
            sourceId,
            fileId,
            pipelineId,
          })
        : null,
    } satisfies PipelineExecutionGraphResult;
  },
);

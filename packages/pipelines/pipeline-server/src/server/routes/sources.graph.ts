import type { ExecutionGraphResponse } from "#shared/schemas/execution";
import { schema } from "#server/db";
import { and, eq } from "drizzle-orm";
import { H3, HTTPError } from "h3";

export const sourcesGraphRouter: H3 = new H3();

sourcesGraphRouter.get(
  "/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/graph",
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

    const execution = await db.query.executions.findFirst({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.sourceId, sourceId),
        eq(schema.executions.fileId, fileId),
        eq(schema.executions.pipelineId, pipelineId),
        eq(schema.executions.id, executionId),
      ),
      columns: { id: true, pipelineId: true, graph: true, status: true },
    });

    if (!execution) {
      throw HTTPError.status(404, `Execution "${executionId}" not found`);
    }

    return {
      executionId: execution.id,
      pipelineId: execution.pipelineId,
      status: execution.status,
      graph: execution.graph ?? null,
    } satisfies ExecutionGraphResponse;
  },
);

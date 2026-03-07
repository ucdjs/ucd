import { schema } from "#server/db";
import { and, eq } from "drizzle-orm";
import { H3, HTTPError } from "h3";

export const sourcesGraphRouter: H3 = new H3();

sourcesGraphRouter.get(
  "/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/graph",
  async (event) => {
    const { db } = event.context;
    const workspaceId = event.context.workspaceId;
    const executionId = event.context.params?.executionId;
    if (!executionId) {
      throw HTTPError.status(400, "Execution ID is required");
    }

    const pipelineId = event.context.params!.pipelineId!;

    const execution = await db.query.executions.findFirst({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ),
      columns: { id: true, pipelineId: true, graph: true },
    });

    if (!execution) {
      throw HTTPError.status(404, `Execution "${executionId}" not found`);
    }

    if (execution.pipelineId !== pipelineId) {
      throw HTTPError.status(404, `Execution "${executionId}" not found for pipeline "${pipelineId}"`);
    }

    return {
      executionId: execution.id,
      pipelineId: execution.pipelineId,
      graph: execution.graph ?? null,
    };
  },
);

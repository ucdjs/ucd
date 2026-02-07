import { eq } from "drizzle-orm";
import { H3 } from "h3";
import { schema } from "#server/db";

export const pipelinesGraphRouter = new H3();

pipelinesGraphRouter.get("/:file/:id/executions/:executionId/graph", async (event) => {
  const { db } = event.context;
  const executionId = event.context.params?.executionId;
  const pipelineId = event.context.params?.id;

  if (!executionId || !pipelineId) {
    return { error: "Execution ID and pipeline ID are required" };
  }

  try {
    const execution = await db.query.executions.findFirst({
      where: eq(schema.executions.id, executionId),
      columns: { id: true, pipelineId: true, graph: true },
    });

    if (!execution) {
      return { error: `Execution "${executionId}" not found` };
    }

    if (execution.pipelineId !== pipelineId) {
      return { error: `Execution "${executionId}" not found for pipeline "${pipelineId}"` };
    }

    return {
      executionId: execution.id,
      pipelineId: execution.pipelineId,
      graph: execution.graph ?? null,
    };
  } catch (err) {
    console.error("Failed to fetch execution graph:", err);
    return {
      error: "Failed to fetch execution graph",
      details: err instanceof Error ? err.message : String(err),
    };
  }
});

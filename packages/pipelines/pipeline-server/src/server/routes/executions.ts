import { desc, eq } from "drizzle-orm";
import { getQuery, H3 } from "h3";
import * as schema from "../db/schema";

export const executionsRouter = new H3();

// GET /api/pipelines/:id/executions?limit=50&offset=0
executionsRouter.get("/", async (event) => {
  const { db } = event.context;
  const pipelineId = event.context.params?.id;

  if (!pipelineId) {
    return { error: "Pipeline ID is required" };
  }

  const query = getQuery(event);
  const limit = Math.min(
    typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 50,
    100, // Max limit of 100
  );
  const offset = typeof query.offset === "string" ? Number.parseInt(query.offset, 10) : 0;

  try {
    // Get executions for this pipeline, ordered by startedAt desc
    const executions = await db.query.executions.findMany({
      where: eq(schema.executions.pipelineId, pipelineId),
      orderBy: desc(schema.executions.startedAt),
      limit,
      offset,
    });

    // Get total count for pagination info
    const countResult = await db.query.executions.findMany({
      where: eq(schema.executions.pipelineId, pipelineId),
      columns: { id: true },
    });
    const total = countResult.length;

    return {
      executions: executions.map((exec) => ({
        id: exec.id,
        pipelineId: exec.pipelineId,
        status: exec.status,
        startedAt: exec.startedAt.toISOString(),
        completedAt: exec.completedAt?.toISOString() ?? null,
        versions: exec.versions,
        summary: exec.summary,
        error: exec.error,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (err) {
    console.error("Failed to fetch executions:", err);
    return {
      error: "Failed to fetch executions",
      details: err instanceof Error ? err.message : String(err),
    };
  }
});

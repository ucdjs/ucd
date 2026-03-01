import { schema } from "#server/db";
import { and, eq } from "drizzle-orm";
import { getQuery, H3 } from "h3";

export const sourcesExecutionRouter: H3 = new H3();

// GET /api/sources/:sourceId/:fileId/:pipelineId/executions/:executionId - Execution details
sourcesExecutionRouter.get("/:sourceId/:fileId/:pipelineId/executions/:executionId", async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const executionId = event.context.params?.executionId;

  if (!executionId || !workspaceId) {
    return { error: "Execution ID and workspace ID are required" };
  }

  try {
    // Get execution
    const execution = await db.query.executions.findFirst({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ),
    });

    if (!execution) {
      return { error: "Execution not found" };
    }

    // Get events
    const events = await db.query.events.findMany({
      where: and(
        eq(schema.events.workspaceId, workspaceId),
        eq(schema.events.executionId, executionId),
      ),
      orderBy: (events, { asc }) => [asc(events.timestamp)],
    });

    // Get logs
    const logs = await db.query.executionLogs.findMany({
      where: and(
        eq(schema.executionLogs.workspaceId, workspaceId),
        eq(schema.executionLogs.executionId, executionId),
      ),
      orderBy: (logs, { asc }) => [asc(logs.timestamp)],
    });

    return {
      execution: {
        id: execution.id,
        pipelineId: execution.pipelineId,
        status: execution.status,
        startedAt: execution.startedAt.toISOString(),
        completedAt: execution.completedAt?.toISOString() ?? null,
        versions: execution.versions,
        summary: execution.summary,
        graph: execution.graph,
        error: execution.error,
      },
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        timestamp: e.timestamp.toISOString(),
        data: e.data,
      })),
      logs: logs.map((l) => ({
        id: l.id,
        stream: l.stream,
        message: l.message,
        timestamp: l.timestamp.toISOString(),
        payload: l.payload,
      })),
    };
  } catch (err) {
    console.error("Failed to fetch execution:", err);
    return {
      error: "Failed to fetch execution",
      details: err instanceof Error ? err.message : String(err),
    };
  }
});

// GET /api/sources/:sourceId/:fileId/:pipelineId/executions/:executionId/events - Execution events
sourcesExecutionRouter.get("/:sourceId/:fileId/:pipelineId/executions/:executionId/events", async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const executionId = event.context.params?.executionId;
  const query = getQuery(event);
  const limit = typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 500;

  if (!executionId || !workspaceId) {
    return { error: "Execution ID and workspace ID are required" };
  }

  try {
    const execution = await db.query.executions.findFirst({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ),
    });

    if (!execution) {
      return { error: "Execution not found" };
    }

    const events = await db.query.events.findMany({
      where: and(
        eq(schema.events.workspaceId, workspaceId),
        eq(schema.events.executionId, executionId),
      ),
      orderBy: (events, { asc }) => [asc(events.timestamp)],
      limit,
    });

    return {
      executionId,
      pipelineId: execution.pipelineId,
      status: execution.status,
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        timestamp: e.timestamp.toISOString(),
        data: e.data,
      })),
      pagination: {
        total: events.length,
        limit,
        offset: 0,
        hasMore: false,
      },
    };
  } catch (err) {
    console.error("Failed to fetch execution events:", err);
    return {
      error: "Failed to fetch execution events",
      details: err instanceof Error ? err.message : String(err),
    };
  }
});

// GET /api/sources/:sourceId/:fileId/:pipelineId/executions/:executionId/logs - Execution logs
sourcesExecutionRouter.get("/:sourceId/:fileId/:pipelineId/executions/:executionId/logs", async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const executionId = event.context.params?.executionId;
  const query = getQuery(event);
  const limit = typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 500;

  if (!executionId || !workspaceId) {
    return { error: "Execution ID and workspace ID are required" };
  }

  try {
    const execution = await db.query.executions.findFirst({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ),
    });

    if (!execution) {
      return { error: "Execution not found" };
    }

    const logs = await db.query.executionLogs.findMany({
      where: and(
        eq(schema.executionLogs.workspaceId, workspaceId),
        eq(schema.executionLogs.executionId, executionId),
      ),
      orderBy: (logs, { asc }) => [asc(logs.timestamp)],
      limit,
    });

    return {
      executionId,
      pipelineId: execution.pipelineId,
      status: execution.status,
      logs: logs.map((l) => ({
        id: l.id,
        spanId: l.spanId,
        stream: l.stream,
        message: l.message,
        timestamp: l.timestamp.toISOString(),
        payload: l.payload,
      })),
      truncated: false,
      capturedSize: 0,
      originalSize: null,
      pagination: {
        total: logs.length,
        limit,
        offset: 0,
        hasMore: false,
      },
    };
  } catch (err) {
    console.error("Failed to fetch execution logs:", err);
    return {
      error: "Failed to fetch execution logs",
      details: err instanceof Error ? err.message : String(err),
    };
  }
});

// GET /api/sources/:sourceId/:fileId/:pipelineId/executions/:executionId/graph - Execution graph
sourcesExecutionRouter.get("/:sourceId/:fileId/:pipelineId/executions/:executionId/graph", async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const executionId = event.context.params?.executionId;

  if (!executionId || !workspaceId) {
    return { error: "Execution ID and workspace ID are required" };
  }

  try {
    const execution = await db.query.executions.findFirst({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ),
    });

    if (!execution) {
      return { error: "Execution not found" };
    }

    return {
      graph: execution.graph,
    };
  } catch (err) {
    console.error("Failed to fetch execution graph:", err);
    return {
      error: "Failed to fetch execution graph",
      details: err instanceof Error ? err.message : String(err),
    };
  }
});

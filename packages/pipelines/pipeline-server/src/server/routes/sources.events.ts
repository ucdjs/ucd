import { schema } from "#server/db";
import type { ExecutionEventsResponse } from "@ucdjs/pipelines-ui";
import { and, asc, eq, sql } from "drizzle-orm";
import { getQuery, H3, HTTPError } from "h3";

export const sourcesEventsRouter: H3 = new H3();

sourcesEventsRouter.get(
  "/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/events",
  async (event) => {
    const { db } = event.context;
    const workspaceId = event.context.workspaceId;
    const executionId = event.context.params?.executionId;
    if (!executionId) {
      throw HTTPError.status(400, "Execution ID is required");
    }

    const query = getQuery(event);
    const limit = Math.min(
      typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 100,
      500,
    );
    const offset = typeof query.offset === "string" ? Number.parseInt(query.offset, 10) : 0;

    const execution = await db.query.executions.findFirst({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ),
      columns: { id: true, pipelineId: true, status: true },
    });

    if (!execution) {
      throw HTTPError.status(404, `Execution "${executionId}" not found`);
    }

    const where = and(
      eq(schema.events.workspaceId, workspaceId),
      eq(schema.events.executionId, executionId),
    );

    const [events, countResult] = await Promise.all([
      db.query.events.findMany({ where, orderBy: asc(schema.events.timestamp), limit, offset }),
      db.select({ count: sql<number>`count(*)` }).from(schema.events).where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      executionId,
      pipelineId: execution.pipelineId,
      status: execution.status,
      events: events.map((evt) => ({
        id: evt.id,
        type: evt.type,
        timestamp: evt.timestamp.toISOString(),
        data: evt.data,
      })),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    } satisfies ExecutionEventsResponse;
  },
);

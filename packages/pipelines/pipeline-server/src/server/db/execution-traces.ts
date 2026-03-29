import type { Database } from "#server/db";
import { schema } from "#server/db";
import { and, eq, inArray } from "drizzle-orm";

const TRACE_TABLE_NAME = "execution_traces";

export function hasExecutionTracesTable(db: Database): boolean {
  const statement = db.$client.prepare(
    "select 1 from sqlite_master where type = 'table' and name = ? limit 1",
  );
  const row = statement.get(TRACE_TABLE_NAME);
  return row != null;
}

export function isIgnorableExecutionTraceWriteError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes(`no such table: ${TRACE_TABLE_NAME}`)
    || error.message.includes("FOREIGN KEY constraint failed");
}

export async function listExecutionIdsWithTraces(
  db: Database,
  workspaceId: string,
  executionIds: readonly string[],
): Promise<Set<string>> {
  if (executionIds.length === 0 || !hasExecutionTracesTable(db)) {
    return new Set();
  }

  const rows = await db
    .selectDistinct({ executionId: schema.executionTraces.executionId })
    .from(schema.executionTraces)
    .where(and(
      eq(schema.executionTraces.workspaceId, workspaceId),
      inArray(schema.executionTraces.executionId, [...executionIds]),
    ));

  return new Set(rows.map((row) => row.executionId));
}

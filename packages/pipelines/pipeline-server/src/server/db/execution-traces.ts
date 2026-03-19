import type { Database } from "#server/db";

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

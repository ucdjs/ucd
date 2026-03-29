import type { Database } from "#server/db";
import { schema } from "#server/db";
import { and, eq, inArray } from "drizzle-orm";

export async function listExecutionIdsWithTraces(
  db: Database,
  workspaceId: string,
  executionIds: readonly string[],
): Promise<Set<string>> {
  if (executionIds.length === 0) {
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

import type { ParsedRow, PropertyJson, ResolveContext, ResolvedEntry } from "@ucdjs/pipelines-core";

/**
 * Groups entries by the first character of their value.
 * Produces one PropertyJson per group (e.g. Colors_R, Colors_G, ...).
 */
export async function groupByInitialResolver(
  ctx: ResolveContext,
  rows: AsyncIterable<ParsedRow>,
): Promise<PropertyJson[]> {
  const groups = new Map<string, ResolvedEntry[]>();

  for await (const row of rows) {
    const value = normalizeValue(row);
    const initial = value.charAt(0).toUpperCase() || "#";

    if (!groups.has(initial)) {
      groups.set(initial, []);
    }
    groups.get(initial)!.push({
      codePoint: row.codePoint,
      value,
    });
  }

  return Array.from(groups.entries(), ([initial, entries]) => ({
    version: ctx.version,
    property: `${ctx.file.name.replace(".txt", "")}_${initial}`,
    file: ctx.file.name,
    entries,
  }));
}

/**
 * Collects all entries and attaches a summary in meta (total count + timestamp).
 */
export async function summaryResolver(
  ctx: ResolveContext,
  rows: AsyncIterable<ParsedRow>,
): Promise<PropertyJson[]> {
  const entries: ResolvedEntry[] = [];

  for await (const row of rows) {
    entries.push({
      codePoint: row.codePoint,
      value: normalizeValue(row),
    });
  }

  return [{
    version: ctx.version,
    property: ctx.file.name.replace(".txt", ""),
    file: ctx.file.name,
    entries,
    meta: {
      totalCount: entries.length,
      generatedAt: String(ctx.now()),
    },
  }];
}

function normalizeValue(row: ParsedRow): string {
  return Array.isArray(row.value) ? row.value.join(", ") : (row.value ?? "");
}

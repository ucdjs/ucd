import type { ParsedRow, PropertyJson, ResolvedEntry, RouteResolveContext } from "@ucdjs/pipelines-core";

export interface GroupedResolverOptions {
  groupBy: "property" | "value" | ((row: ParsedRow) => string);
  propertyNameFn?: (groupKey: string, ctx: RouteResolveContext) => string;
}

function rowToResolvedEntry(row: ParsedRow): ResolvedEntry | null {
  const value = row.value;
  if (value === undefined) {
    return null;
  }

  if (row.kind === "point" && row.codePoint) {
    return { codePoint: row.codePoint, value };
  }

  if (row.kind === "range" && row.start && row.end) {
    return { range: `${row.start}..${row.end}`, value };
  }

  if (row.kind === "sequence" && row.sequence) {
    return { sequence: row.sequence, value };
  }

  return null;
}

export function createGroupedResolver(options: GroupedResolverOptions) {
  const { groupBy, propertyNameFn } = options;

  const getGroupKey = typeof groupBy === "function"
    ? groupBy
    : groupBy === "property"
      ? (row: ParsedRow) => row.property || "unknown"
      : (row: ParsedRow) => {
          const v = row.value;
          return Array.isArray(v) ? v.join(",") : v || "unknown";
        };

  return async function groupedResolver(
    ctx: RouteResolveContext,
    rows: AsyncIterable<ParsedRow>,
  ): Promise<PropertyJson[]> {
    const groups = new Map<string, ResolvedEntry[]>();

    for await (const row of rows) {
      const key = getGroupKey(row);
      const entry = rowToResolvedEntry(row);

      if (entry) {
        const existing = groups.get(key) || [];
        existing.push(entry);
        groups.set(key, existing);
      }
    }

    const results: PropertyJson[] = [];

    for (const [key, entries] of groups) {
      const propertyName = propertyNameFn
        ? propertyNameFn(key, ctx)
        : key;

      results.push({
        version: ctx.version,
        property: propertyName,
        file: ctx.file.name,
        entries: ctx.normalizeEntries(entries),
      });
    }

    return results;
  };
}

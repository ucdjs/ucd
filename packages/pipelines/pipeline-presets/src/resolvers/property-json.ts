import type { ArtifactDefinition, ParsedRow, PropertyJson, ResolvedEntry, RouteResolveContext } from "@ucdjs/pipelines-core";

export interface PropertyJsonResolverOptions {
  property?: string;
  includeDefaults?: boolean;
}

function rowToResolvedEntry(row: ParsedRow): ResolvedEntry | null {
  const value = row.value;
  if (value === undefined) {
    return null;
  }

  if (row.kind === "point" && row.codePoint) {
    return {
      codePoint: row.codePoint,
      value,
    };
  }

  if (row.kind === "range" && row.start && row.end) {
    return {
      range: `${row.start}..${row.end}`,
      value,
    };
  }

  if (row.kind === "sequence" && row.sequence) {
    return {
      sequence: row.sequence,
      value,
    };
  }

  return null;
}

export function createPropertyJsonResolver(options: PropertyJsonResolverOptions = {}) {
  return async function propertyJsonResolver<
    TArtifactKeys extends string,
    TEmits extends Record<string, ArtifactDefinition>,
  >(
    ctx: RouteResolveContext<TArtifactKeys, TEmits>,
    rows: AsyncIterable<ParsedRow>,
  ): Promise<PropertyJson[]> {
    const entries: ResolvedEntry[] = [];

    for await (const row of rows) {
      const entry = rowToResolvedEntry(row);
      if (entry) {
        entries.push(entry);
      }
    }

    const propertyName = options.property || ctx.file.name.replace(/\.txt$/, "");

    return [{
      version: ctx.version,
      property: propertyName,
      file: ctx.file.name,
      entries: ctx.normalizeEntries(entries),
    }];
  };
}

export const propertyJsonResolver = createPropertyJsonResolver();

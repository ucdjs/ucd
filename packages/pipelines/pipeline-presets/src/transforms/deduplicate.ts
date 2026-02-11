import type { ParsedRow } from "@ucdjs/pipelines-core";
import { definePipelineTransform } from "@ucdjs/pipelines-core";

function getRowKey(row: ParsedRow): string {
  if (row.kind === "point" && row.codePoint) {
    return `point:${row.codePoint}`;
  }
  if (row.kind === "range" && row.start && row.end) {
    return `range:${row.start}..${row.end}`;
  }
  if (row.kind === "sequence" && row.sequence) {
    return `seq:${row.sequence.join("-")}`;
  }
  return `unknown:${JSON.stringify(row)}`;
}

export const deduplicateRows = definePipelineTransform<ParsedRow, ParsedRow>({
  id: "deduplicate-rows",
  async* fn(_ctx, rows) {
    const seen = new Set<string>();

    for await (const row of rows) {
      const key = getRowKey(row);

      if (!seen.has(key)) {
        seen.add(key);
        yield row;
      }
    }
  },
});

export type DeduplicateStrategy = "first" | "last" | "merge";

export interface DeduplicateOptions {
  strategy?: DeduplicateStrategy;
  keyFn?: (row: ParsedRow) => string;
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createDeduplicateTransform(options: DeduplicateOptions = {}) {
  const { strategy = "first", keyFn = getRowKey } = options;

  if (strategy === "last") {
    return definePipelineTransform<ParsedRow, ParsedRow>({
      id: "deduplicate-rows-last",
      async* fn(_ctx, rows) {
        const byKey = new Map<string, ParsedRow>();

        for await (const row of rows) {
          const key = keyFn(row);
          byKey.set(key, row);
        }

        yield* byKey.values();
      },
    });
  }

  return definePipelineTransform<ParsedRow, ParsedRow>({
    id: "deduplicate-rows-first",
    async* fn(_ctx, rows) {
      const seen = new Set<string>();

      for await (const row of rows) {
        const key = keyFn(row);

        if (!seen.has(key)) {
          seen.add(key);
          yield row;
        }
      }
    },
  });
}

import type { PipelineTransformDefinition } from "../transform";
import type { ParsedRow } from "../types";
import { definePipelineTransform } from "../transform";

function hexToNumber(hex: string): number {
  return Number.parseInt(hex, 16);
}

function getRowSortKey(row: ParsedRow): number {
  if (row.codePoint) {
    return hexToNumber(row.codePoint);
  }
  if (row.start) {
    return hexToNumber(row.start);
  }
  if (row.sequence && row.sequence.length > 0) {
    const first = row.sequence[0];
    if (first) {
      return hexToNumber(first);
    }
  }
  return 0;
}

export const sortByCodePoint = definePipelineTransform<ParsedRow, ParsedRow>({
  id: "sort-by-code-point",
  async* fn(_ctx, rows) {
    const collected: ParsedRow[] = [];
    for await (const row of rows) {
      collected.push(row);
    }
    collected.sort((a, b) => getRowSortKey(a) - getRowSortKey(b));
    yield* collected;
  },
});

export type SortDirection = "asc" | "desc";

export interface SortOptions {
  direction?: SortDirection;
  keyFn?: (row: ParsedRow) => number;
}

export function createSortTransform(options: SortOptions = {}): PipelineTransformDefinition<ParsedRow, ParsedRow> {
  const { direction = "asc", keyFn = getRowSortKey } = options;
  const multiplier = direction === "asc" ? 1 : -1;

  return definePipelineTransform<ParsedRow, ParsedRow>({
    id: `sort-${direction}`,
    async* fn(_ctx, rows) {
      const collected: ParsedRow[] = [];
      for await (const row of rows) {
        collected.push(row);
      }
      collected.sort((a, b) => multiplier * (keyFn(a) - keyFn(b)));
      yield* collected;
    },
  });
}

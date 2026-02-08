import type { ParsedRow } from "@ucdjs/pipelines-core";
import { definePipelineTransform } from "@ucdjs/pipelines-core";

function hexToNumber(hex: string): number {
  return Number.parseInt(hex, 16);
}

function numberToHex(num: number): string {
  return num.toString(16).toUpperCase().padStart(4, "0");
}

export const expandRanges = definePipelineTransform<ParsedRow, ParsedRow>({
  id: "expand-ranges",
  async* fn(_ctx, rows) {
    for await (const row of rows) {
      if (row.kind === "range" && row.start && row.end) {
        const start = hexToNumber(row.start);
        const end = hexToNumber(row.end);

        for (let i = start; i <= end; i++) {
          yield {
            ...row,
            kind: "point",
            codePoint: numberToHex(i),
            start: undefined,
            end: undefined,
          };
        }
      } else {
        yield row;
      }
    }
  },
});

export interface ExpandRangesOptions {
  maxExpansion?: number;
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createExpandRangesTransform(options: ExpandRangesOptions = {}) {
  const { maxExpansion = 10000 } = options;

  return definePipelineTransform<ParsedRow, ParsedRow>({
    id: "expand-ranges-limited",
    async* fn(_ctx, rows) {
      for await (const row of rows) {
        if (row.kind === "range" && row.start && row.end) {
          const start = hexToNumber(row.start);
          const end = hexToNumber(row.end);
          const size = end - start + 1;

          if (size > maxExpansion) {
            yield row;
            continue;
          }

          for (let i = start; i <= end; i++) {
            yield {
              ...row,
              kind: "point",
              codePoint: numberToHex(i),
              start: undefined,
              end: undefined,
            };
          }
        } else {
          yield row;
        }
      }
    },
  });
}

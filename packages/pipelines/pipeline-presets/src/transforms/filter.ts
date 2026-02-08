import type { ParsedRow, PipelineFilter } from "@ucdjs/pipelines-core";
import { definePipelineTransform } from "@ucdjs/pipelines-core";

export interface RowFilterOptions {
  property?: string | RegExp;
  value?: string | RegExp;
  kind?: ParsedRow["kind"] | ParsedRow["kind"][];
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createRowFilter(options: RowFilterOptions) {
  return definePipelineTransform<ParsedRow, ParsedRow>({
    id: "row-filter",
    async* fn(ctx, rows) {
      for await (const row of rows) {
        if (options.property) {
          if (!row.property) {
            continue;
          }
          if (typeof options.property === "string") {
            if (row.property !== options.property) {
              continue;
            }
          } else if (!options.property.test(row.property)) {
            continue;
          }
        }

        if (options.value) {
          const rowValue = Array.isArray(row.value) ? row.value.join(",") : row.value;
          if (!rowValue) {
            continue;
          }
          if (typeof options.value === "string") {
            if (rowValue !== options.value) {
              continue;
            }
          } else if (!options.value.test(rowValue)) {
            continue;
          }
        }

        if (options.kind) {
          const kinds = Array.isArray(options.kind) ? options.kind : [options.kind];
          if (!kinds.includes(row.kind)) {
            continue;
          }
        }

        yield row;
      }
    },
  });
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createFilterByPipelineFilter(filter: PipelineFilter) {
  return definePipelineTransform<ParsedRow, ParsedRow>({
    id: "filter-by-pipeline-filter",
    async* fn(ctx, rows) {
      for await (const row of rows) {
        const filterCtx = {
          file: ctx.file,
          row: row.property ? { property: row.property } : undefined,
        };

        if (filter(filterCtx)) {
          yield row;
        }
      }
    },
  });
}

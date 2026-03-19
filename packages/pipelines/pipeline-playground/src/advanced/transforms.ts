import type { ParsedRow } from "@ucdjs/pipelines-core";
import { definePipelineTransform } from "@ucdjs/pipelines-core";

export const filterEmptyValues = definePipelineTransform<ParsedRow, ParsedRow>({
  id: "filter-empty-values",
  async* fn(_ctx, rows) {
    for await (const row of rows) {
      if (row.value && row.value !== "" && row.value !== "<none>") {
        yield row;
      }
    }
  },
});

export const addMetadata = definePipelineTransform<ParsedRow, ParsedRow>({
  id: "add-metadata",
  async* fn(ctx, rows) {
    for await (const row of rows) {
      yield {
        ...row,
        meta: {
          ...row.meta,
          processedAt: new Date().toISOString(),
          sourceVersion: ctx.version,
        },
      };
    }
  },
});

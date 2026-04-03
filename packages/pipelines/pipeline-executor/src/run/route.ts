import type {
  FileContext,
  ParseContext,
  ParsedRow,
  PipelineFilter,
  PipelineLogger,
  PipelineTransformDefinition,
  ResolveContext,
} from "@ucdjs/pipeline-core";
import type { ExecutionContext } from "./context";
import { applyTransforms } from "@ucdjs/pipeline-core";
import { buildParseContext, buildResolveContext, buildTransformContext } from "./context";

export interface ExecuteParseResolveOptions {
  ctx: ExecutionContext;
  routeId: string;
  parser: (parseCtx: ParseContext) => AsyncIterable<ParsedRow>;
  filter?: PipelineFilter;
  transforms?: readonly PipelineTransformDefinition<any, any>[];
  resolver: (resolveCtx: ResolveContext, rows: AsyncIterable<ParsedRow>) => Promise<unknown>;
}

export async function executeParseResolve(options: ExecuteParseResolveOptions): Promise<unknown[]> {
  const { ctx, routeId, parser, filter, transforms, resolver } = options;

  return ctx.runtime.startSpan("parse", async (parseSpan) => {
    parseSpan.setAttributes({
      "pipeline.id": ctx.pipelineId,
      "pipeline.version": ctx.version,
      "route.id": routeId,
      "file.path": ctx.file.path,
      "file.name": ctx.file.name,
      "file.dir": ctx.file.dir,
      "file.ext": ctx.file.ext,
      "file.version": ctx.file.version,
    });

    const parseCtx = buildParseContext(ctx);
    const parsedRows = parser(parseCtx);

    const { iter: filteredRowsIter, getCounts } = createFilteredRowIter(
      parsedRows,
      ctx.file,
      filter,
      ctx.logger,
    );

    const resolverRows = (transforms && transforms.length > 0)
      ? applyTransforms(buildTransformContext(ctx), filteredRowsIter, transforms)
      : filteredRowsIter;

    const resolveCtx = buildResolveContext(ctx, routeId);

    const outputArray = await ctx.runtime.startSpan("resolve", async (resolveSpan) => {
      resolveSpan.setAttributes({
        "pipeline.id": ctx.pipelineId,
        "pipeline.version": ctx.version,
        "route.id": routeId,
        "file.path": ctx.file.path,
        "file.name": ctx.file.name,
        "file.dir": ctx.file.dir,
        "file.ext": ctx.file.ext,
        "file.version": ctx.file.version,
      });

      const outputs = await resolver(resolveCtx, resolverRows as AsyncIterable<ParsedRow>);
      const arr = Array.isArray(outputs) ? outputs : [outputs];
      resolveSpan.setAttribute("output.count", arr.length);
      return arr;
    }) as unknown[];

    // Set row counts after the resolver has lazily consumed the parse iterator
    const { total, filtered } = getCounts();
    parseSpan.setAttributes({
      "row.count": total,
      "filtered.row.count": filtered,
    });

    return outputArray;
  }) as Promise<unknown[]>;
}

function createFilteredRowIter(
  rows: AsyncIterable<ParsedRow>,
  file: FileContext,
  filter: PipelineFilter | undefined,
  logger: PipelineLogger,
): { iter: AsyncIterable<ParsedRow>; getCounts: () => { total: number; filtered: number } } {
  let total = 0;
  let filtered = 0;

  async function* gen(): AsyncGenerator<ParsedRow> {
    for await (const row of rows) {
      total++;

      if (!filter) {
        filtered++;
        yield row;
        continue;
      }

      const shouldInclude = filter({
        file,
        logger,
        row: { property: row.property },
      });

      if (shouldInclude) {
        filtered++;
        yield row;
      }
    }
  }

  return { iter: gen(), getCounts: () => ({ total, filtered }) };
}

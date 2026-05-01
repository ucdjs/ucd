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
import { runPipelineHook } from "./hooks";

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

    await runPipelineHook("parse:start", () => ctx.hooks?.parse?.({
      phase: "start",
      pipelineId: ctx.pipelineId,
      version: ctx.version,
      file: ctx.file,
      routeId,
      logger: ctx.logger,
    }), { logger: ctx.logger });

    let outputArray: unknown[] | undefined;
    let parseError: unknown;
    let getCounts = (): { total: number; filtered: number } => ({ total: 0, filtered: 0 });

    try {
      const parseCtx = buildParseContext(ctx);
      const parsedRows = parser(parseCtx);

      const filteredRows = createFilteredRowIter(
        parsedRows,
        ctx.file,
        filter,
        ctx.logger,
      );
      getCounts = filteredRows.getCounts;

      const resolverRows = (transforms && transforms.length > 0)
        ? applyTransforms(buildTransformContext(ctx), filteredRows.iter, transforms)
        : filteredRows.iter;

      const resolveCtx = buildResolveContext(ctx, routeId);

      outputArray = await ctx.runtime.startSpan("resolve", async (resolveSpan) => {
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

        await runPipelineHook("resolve:start", () => ctx.hooks?.resolve?.({
          phase: "start",
          pipelineId: ctx.pipelineId,
          version: ctx.version,
          file: ctx.file,
          routeId,
          logger: ctx.logger,
        }), { logger: ctx.logger });

        let resolveOutputs: unknown[] | undefined;
        let resolveError: unknown;

        try {
          const outputs = await resolver(resolveCtx, resolverRows as AsyncIterable<ParsedRow>);
          resolveOutputs = Array.isArray(outputs) ? outputs : [outputs];
          resolveSpan.setAttribute("output.count", resolveOutputs.length);
          return resolveOutputs;
        } catch (error) {
          resolveError = error;
          throw error;
        } finally {
          await runPipelineHook("resolve:end", () => ctx.hooks?.resolve?.({
            phase: "end",
            pipelineId: ctx.pipelineId,
            version: ctx.version,
            file: ctx.file,
            routeId,
            logger: ctx.logger,
            outputs: resolveOutputs,
            error: resolveError,
          }), { logger: ctx.logger });
        }
      }) as unknown[];

      return outputArray;
    } catch (error) {
      parseError = error;
      throw error;
    } finally {
      // Set row counts after the resolver has lazily consumed the parse iterator
      const { total, filtered } = getCounts();
      parseSpan.setAttributes({
        "row.count": total,
        "filtered.row.count": filtered,
      });

      await runPipelineHook("parse:end", () => ctx.hooks?.parse?.({
        phase: "end",
        pipelineId: ctx.pipelineId,
        version: ctx.version,
        file: ctx.file,
        routeId,
        logger: ctx.logger,
        rowCount: total,
        filteredRowCount: filtered,
        outputs: outputArray,
        error: parseError,
      }), { logger: ctx.logger });
    }
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

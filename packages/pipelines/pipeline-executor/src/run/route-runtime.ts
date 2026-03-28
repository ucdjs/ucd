import type {
  AnyPipelineRouteDefinition,
  FallbackRouteDefinition,
  FileContext,
  ParsedRow,
  PipelineFilter,
  PipelineTransformDefinition,
  ResolveContext,
} from "@ucdjs/pipelines-core";
import type {
  PipelineTraceEmitInput,
  PipelineTraceRecord,
} from "@ucdjs/pipelines-core/tracing";
import type { PipelineExecutionRuntime } from "../runtime";
import type { SourceAdapter } from "./source-files";
import { applyTransforms } from "@ucdjs/pipelines-core";
import { createPipelineLogger } from "../internal/logger";
import { createParseContext } from "./source-files";

export interface ProcessRouteResult {
  outputs: unknown[];
}

export interface ProcessRouteOptions {
  file: FileContext;
  route: AnyPipelineRouteDefinition;
  routeDataMap: Record<string, unknown[]>;
  runtime: PipelineExecutionRuntime;
  source: SourceAdapter;
  version: string;
  emitTrace: (trace: PipelineTraceEmitInput) => Promise<PipelineTraceRecord>;
  spanId: () => string;
  hrNow: () => number;
}

interface ResolveContextOptions {
  version: string;
  file: FileContext;
  routeId: string;
  runtime: PipelineExecutionRuntime;
  routeDataMap: Record<string, unknown[]>;
  emitTrace: (trace: PipelineTraceEmitInput) => Promise<PipelineTraceRecord>;
}

interface ResolveContextResult {
  ctx: ResolveContext;
  /** Awaits all dependency.resolve traces queued by synchronous getRouteData calls. */
  flushDependencyTraces: () => Promise<void>;
}

export function createResolveContext(options: ResolveContextOptions): ResolveContextResult {
  const { version, file, routeId, routeDataMap, emitTrace } = options;
  const logger = createPipelineLogger(options.runtime);
  const pending: Promise<PipelineTraceRecord>[] = [];

  const ctx: ResolveContext = {
    version,
    file,
    logger,
    getRouteData: <T = unknown>(targetRouteId: string) => {
      const exists = targetRouteId in routeDataMap;
      // getRouteData is synchronous — buffer the promise and flush after the resolver awaits.
      pending.push(emitTrace({
        kind: "dependency.resolve",
        version,
        file,
        routeId,
        dependsOnRouteId: targetRouteId,
        status: exists ? "resolved" : "missing",
      }));
      if (!exists) {
        throw new Error(`Route data for "${targetRouteId}" not found. Make sure route "${targetRouteId}" runs before route "${routeId}" by declaring it as a dependency.`);
      }
      return Object.freeze(routeDataMap[targetRouteId]!) as readonly T[];
    },
    normalizeEntries: (entries) => {
      return entries.sort((a, b) => {
        const aStart = a.range?.split("..")[0] ?? a.codePoint ?? "";
        const bStart = b.range?.split("..")[0] ?? b.codePoint ?? "";
        return aStart.localeCompare(bStart);
      });
    },
    now: () => new Date().toISOString(),
  };

  return {
    ctx,
    flushDependencyTraces: () => Promise.all(pending).then(() => {}),
  };
}

interface ExecuteParseResolveOptions {
  file: FileContext;
  routeId: string;
  parser: (ctx: ReturnType<typeof createParseContext>) => AsyncIterable<ParsedRow>;
  filter?: PipelineFilter;
  transforms?: readonly PipelineTransformDefinition<any, any>[];
  resolveContext: ResolveContextResult;
  resolver: (ctx: ResolveContext, rows: AsyncIterable<ParsedRow>) => Promise<unknown>;
  runtime: PipelineExecutionRuntime;
  source: SourceAdapter;
  version: string;
  emitTrace: (trace: PipelineTraceEmitInput) => Promise<PipelineTraceRecord>;
  spanId: () => string;
  hrNow: () => number;
}

async function executeParseResolve(options: ExecuteParseResolveOptions): Promise<unknown[]> {
  const { file, routeId, parser, filter, transforms, resolveContext, resolver, runtime, source, version, emitTrace, spanId, hrNow } = options;

  const parseSpanId = spanId();
  const resolveSpanId = spanId();

  const parseStartTimestamp = hrNow();
  const parseStartPerf = performance.now();

  const parseCtx = createParseContext(file, source, runtime);
  const parsedRows = parser(parseCtx);

  const collectedRows: ParsedRow[] = [];
  const filteredRows: ParsedRow[] = [];
  const filteredRowsIter = filterRows(parsedRows, file, filter, runtime, collectedRows, filteredRows);

  const resolverRows = (transforms && transforms.length > 0)
    ? applyTransforms({ version, file, logger: createPipelineLogger(runtime) }, filteredRowsIter, transforms)
    : filteredRowsIter;

  // Note both start timestamps before running the resolver, which lazily consumes parsedRows.
  const resolveStartTimestamp = hrNow();
  const resolveStartPerf = performance.now();

  const outputs = await runtime.withSpan(resolveSpanId, () =>
    resolver(resolveContext.ctx, resolverRows as AsyncIterable<ParsedRow>));
  const outputArray = Array.isArray(outputs) ? outputs : [outputs];

  // Flush dependency.resolve traces collected synchronously during resolver execution.
  await runtime.withSpan(resolveSpanId, resolveContext.flushDependencyTraces);

  // Emit parse span after resolver has consumed the lazy iterable (row counts are now final).
  await runtime.withSpan(parseSpanId, () => emitTrace({
    kind: "parse",
    file,
    routeId,
    rowCount: collectedRows.length,
    filteredRowCount: filteredRows.length,
    startTimestamp: parseStartTimestamp,
    durationMs: performance.now() - parseStartPerf,
    version,
  }));

  await runtime.withSpan(resolveSpanId, () => emitTrace({
    kind: "resolve",
    file,
    routeId,
    outputCount: outputArray.length,
    startTimestamp: resolveStartTimestamp,
    durationMs: performance.now() - resolveStartPerf,
    version,
  }));

  return outputArray;
}

export async function processRoute(options: ProcessRouteOptions): Promise<ProcessRouteResult> {
  const { file, route, routeDataMap, runtime, source, version, emitTrace, hrNow } = options;

  const resolveContext = createResolveContext({
    version,
    file,
    routeId: route.id,
    runtime,
    routeDataMap,
    emitTrace,
  });

  const outputs = await executeParseResolve({
    file,
    routeId: route.id,
    parser: route.parser,
    filter: route.filter,
    transforms: route.transforms,
    resolveContext,
    resolver: route.resolver,
    runtime,
    source,
    version,
    emitTrace,
    spanId: () => options.spanId(),
    hrNow,
  });

  return { outputs };
}

export interface ProcessFallbackOptions {
  file: FileContext;
  fallback: FallbackRouteDefinition;
  routeDataMap: Record<string, unknown[]>;
  runtime: PipelineExecutionRuntime;
  source: SourceAdapter;
  version: string;
  emitTrace: (trace: PipelineTraceEmitInput) => Promise<PipelineTraceRecord>;
  spanId: () => string;
  hrNow: () => number;
}

export async function processFallback(options: ProcessFallbackOptions): Promise<unknown[]> {
  const { file, fallback, routeDataMap, runtime, source, version, emitTrace, spanId, hrNow } = options;

  const resolveContext = createResolveContext({
    version,
    file,
    routeId: "__fallback__",
    runtime,
    routeDataMap,
    emitTrace,
  });

  return executeParseResolve({
    file,
    routeId: "__fallback__",
    parser: fallback.parser,
    filter: fallback.filter,
    resolveContext,
    resolver: fallback.resolver,
    runtime,
    source,
    version,
    emitTrace,
    spanId,
    hrNow,
  });
}

export async function* filterRows(
  rows: AsyncIterable<ParsedRow>,
  file: FileContext,
  filter: PipelineFilter | undefined,
  runtime: PipelineExecutionRuntime,
  collector: ParsedRow[],
  filteredCollector?: ParsedRow[],
): AsyncIterable<ParsedRow> {
  const logger = createPipelineLogger(runtime);

  for await (const row of rows) {
    collector.push(row);

    if (!filter) {
      filteredCollector?.push(row);
      yield row;
      continue;
    }

    const shouldInclude = filter({
      file,
      logger,
      row: { property: row.property },
    });

    if (shouldInclude) {
      filteredCollector?.push(row);
      yield row;
    }
  }
}

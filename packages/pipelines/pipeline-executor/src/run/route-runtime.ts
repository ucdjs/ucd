import type {
  AnyPipelineRouteDefinition,
  FallbackRouteDefinition,
  FileContext,
  ParsedRow,
  PipelineFilter,
  PipelineTransformDefinition,
  ResolveContext,
} from "@ucdjs/pipelines-core";
import type { PipelineTraceEmitInput, PipelineTraceRecord } from "@ucdjs/pipelines-core/tracing";
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
}

interface ResolveContextOptions {
  version: string;
  file: FileContext;
  routeId: string;
  runtime: PipelineExecutionRuntime;
  routeDataMap: Record<string, unknown[]>;
}

export function createResolveContext(
  options: ResolveContextOptions,
): ResolveContext {
  const { version, file, routeId, runtime, routeDataMap } = options;
  const logger = createPipelineLogger(runtime);

  return {
    version,
    file,
    logger,
    getRouteData: <T = unknown>(targetRouteId: string) => {
      if (!(targetRouteId in routeDataMap)) {
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
}

interface ExecuteParseResolveOptions {
  file: FileContext;
  routeId: string;
  parser: (ctx: ReturnType<typeof createParseContext>) => AsyncIterable<ParsedRow>;
  filter?: PipelineFilter;
  transforms?: readonly PipelineTransformDefinition<any, any>[];
  resolveContext: ResolveContext;
  resolver: (ctx: ResolveContext, rows: AsyncIterable<ParsedRow>) => Promise<unknown>;
  runtime: PipelineExecutionRuntime;
  source: SourceAdapter;
  version: string;
  emitTrace: (trace: PipelineTraceEmitInput) => Promise<PipelineTraceRecord>;
  spanId: () => string;
}

async function executeParseResolve(options: ExecuteParseResolveOptions): Promise<unknown[]> {
  const { file, routeId, parser, filter, transforms, resolveContext, resolver, runtime, source, version, emitTrace, spanId } = options;

  // Parse phase
  const parseStartTime = performance.now();
  const parseSpanId = spanId();
  await emitInSpan(runtime, parseSpanId, emitTrace, {
    kind: "parse.start",
    file,
    routeId,
    version,
  });

  const parseCtx = createParseContext(file, source, runtime);
  const parsedRows = parser(parseCtx);

  const collectedRows: ParsedRow[] = [];
  const filteredRows = filterRows(parsedRows, file, filter, runtime, collectedRows);

  const resolverRows = (transforms && transforms.length > 0)
    ? applyTransforms({ version, file, logger: createPipelineLogger(runtime) }, filteredRows, transforms)
    : filteredRows;

  // Resolve phase (parse:end is emitted after resolver consumes the lazy iterables)
  const resolveStartTime = performance.now();
  const resolveSpanId = spanId();
  await emitInSpan(runtime, resolveSpanId, emitTrace, {
    kind: "resolve.start",
    file,
    routeId,
    version,
  });

  const outputs = await resolver(resolveContext, resolverRows as AsyncIterable<ParsedRow>);
  const outputArray = Array.isArray(outputs) ? outputs : [outputs];

  await emitInSpan(runtime, parseSpanId, emitTrace, {
    kind: "parse.end",
    file,
    routeId,
    rowCount: collectedRows.length,
    durationMs: performance.now() - parseStartTime,
    version,
  });

  await emitInSpan(runtime, resolveSpanId, emitTrace, {
    kind: "resolve.end",
    file,
    routeId,
    outputCount: outputArray.length,
    durationMs: performance.now() - resolveStartTime,
    version,
  });

  return outputArray;
}

async function emitInSpan(
  runtime: PipelineExecutionRuntime,
  spanId: string,
  emitTrace: (trace: PipelineTraceEmitInput) => Promise<PipelineTraceRecord>,
  trace: PipelineTraceEmitInput,
): Promise<void> {
  await runtime.withSpan(spanId, () => emitTrace(trace));
}

export async function processRoute(options: ProcessRouteOptions): Promise<ProcessRouteResult> {
  const { file, route, routeDataMap, runtime, source, version, emitTrace } = options;

  const resolveContext = createResolveContext({
    version,
    file,
    routeId: route.id,
    runtime,
    routeDataMap,
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
    spanId: () => {
      return options.spanId();
    },
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
}

export async function processFallback(options: ProcessFallbackOptions): Promise<unknown[]> {
  const { file, fallback, routeDataMap, runtime, source, version, emitTrace, spanId } = options;

  const resolveContext = createResolveContext({
    version,
    file,
    routeId: "__fallback__",
    runtime,
    routeDataMap,
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
  });
}

export async function* filterRows(
  rows: AsyncIterable<ParsedRow>,
  file: FileContext,
  filter: PipelineFilter | undefined,
  runtime: PipelineExecutionRuntime,
  collector: ParsedRow[],
): AsyncIterable<ParsedRow> {
  const logger = createPipelineLogger(runtime);

  for await (const row of rows) {
    collector.push(row);

    if (!filter) {
      yield row;
      continue;
    }

    const shouldInclude = filter({
      file,
      logger,
      row: { property: row.property },
    });

    if (shouldInclude) {
      yield row;
    }
  }
}

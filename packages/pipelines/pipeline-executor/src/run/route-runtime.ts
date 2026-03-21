import type {
  AnyPipelineRouteDefinition,
  FallbackRouteDefinition,
  FileContext,
  ParsedRow,
  PipelineEventInput,
  PipelineFilter,
  PipelineTransformDefinition,
  RouteResolveContext,
} from "@ucdjs/pipelines-core";
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
  emit: (event: PipelineEventInput) => Promise<void>;
  spanId: () => string;
}

interface ResolveContextOptions {
  version: string;
  file: FileContext;
  routeId: string;
  runtime: PipelineExecutionRuntime;
  routeDataMap: Record<string, unknown[]>;
}

export function createRouteResolveContext(
  options: ResolveContextOptions,
): RouteResolveContext {
  const { version, file, routeId, runtime, routeDataMap } = options;
  const logger = createPipelineLogger(runtime);

  return {
    version,
    file,
    logger,
    getRouteData: (targetRouteId: string): unknown[] => {
      if (!(targetRouteId in routeDataMap)) {
        throw new Error(`Route data for "${targetRouteId}" not found. Make sure route "${targetRouteId}" runs before route "${routeId}" by declaring it as a dependency.`);
      }
      return routeDataMap[targetRouteId]!;
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

// --- Shared parse → filter → transform → resolve pipeline ---

interface ExecuteParseResolveOptions {
  file: FileContext;
  routeId: string;
  parser: (ctx: ReturnType<typeof createParseContext>) => AsyncIterable<ParsedRow>;
  filter?: PipelineFilter;
  transforms?: readonly PipelineTransformDefinition<any, any>[];
  resolveContext: RouteResolveContext;
  resolver: (ctx: RouteResolveContext, rows: AsyncIterable<ParsedRow>) => Promise<unknown>;
  runtime: PipelineExecutionRuntime;
  source: SourceAdapter;
  version: string;
  emit: (event: PipelineEventInput) => Promise<void>;
  spanId: () => string;
}

async function executeParseResolve(options: ExecuteParseResolveOptions): Promise<unknown[]> {
  const { file, routeId, parser, filter, transforms, resolveContext, resolver, runtime, source, version, emit, spanId } = options;

  // Parse phase
  const parseStartTime = performance.now();
  const parseSpanId = spanId();
  await emitInSpan(runtime, parseSpanId, emit, {
    type: "parse:start",
    file,
    routeId,
    spanId: parseSpanId,
    timestamp: performance.now(),
  });

  const parseCtx = createParseContext(file, source, runtime);
  const parsedRows = parser(parseCtx);

  const collectedRows: ParsedRow[] = [];
  const filteredRows = filterRows(parsedRows, file, filter, runtime, collectedRows);

  const resolverRows = (transforms && transforms.length > 0)
    ? applyTransforms({ version, file, logger: createPipelineLogger(runtime) }, filteredRows, transforms)
    : filteredRows;

  await emitInSpan(runtime, parseSpanId, emit, {
    type: "parse:end",
    file,
    routeId,
    rowCount: collectedRows.length,
    durationMs: performance.now() - parseStartTime,
    spanId: parseSpanId,
    timestamp: performance.now(),
  });

  // Resolve phase
  const resolveStartTime = performance.now();
  const resolveSpanId = spanId();
  await emitInSpan(runtime, resolveSpanId, emit, {
    type: "resolve:start",
    file,
    routeId,
    spanId: resolveSpanId,
    timestamp: performance.now(),
  });

  const outputs = await resolver(resolveContext, resolverRows as AsyncIterable<ParsedRow>);
  const outputArray = Array.isArray(outputs) ? outputs : [outputs];

  await emitInSpan(runtime, resolveSpanId, emit, {
    type: "resolve:end",
    file,
    routeId,
    outputCount: outputArray.length,
    durationMs: performance.now() - resolveStartTime,
    spanId: resolveSpanId,
    timestamp: performance.now(),
  });

  return outputArray;
}

async function emitInSpan(
  runtime: PipelineExecutionRuntime,
  spanId: string,
  emit: (event: PipelineEventInput) => Promise<void>,
  event: PipelineEventInput,
): Promise<void> {
  await runtime.withSpan(spanId, () => emit(event));
}

// --- Public API ---

export async function processRoute(options: ProcessRouteOptions): Promise<ProcessRouteResult> {
  const { file, route, routeDataMap, runtime, source, version, emit } = options;

  const resolveContext = createRouteResolveContext({
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
    emit,
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
  emit: (event: PipelineEventInput) => Promise<void>;
  spanId: () => string;
}

export async function processFallback(options: ProcessFallbackOptions): Promise<unknown[]> {
  const { file, fallback, routeDataMap, runtime, source, version, emit, spanId } = options;

  const resolveContext = createRouteResolveContext({
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
    emit,
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

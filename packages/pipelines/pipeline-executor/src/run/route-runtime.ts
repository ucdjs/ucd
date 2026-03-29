import type {
  AnyPipelineRouteDefinition,
  FallbackRouteDefinition,
  FileContext,
  ParsedRow,
  PipelineFilter,
  PipelineTransformDefinition,
  ResolveContext,
} from "@ucdjs/pipelines-core";
import type { PipelineExecutionRuntime } from "../runtime";
import type { SourceAdapter } from "./source-files";
import { trace } from "@opentelemetry/api";
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
  pipelineId: string;
}

interface ResolveContextOptions {
  version: string;
  file: FileContext;
  routeId: string;
  runtime: PipelineExecutionRuntime;
  routeDataMap: Record<string, unknown[]>;
}

function createResolveContext(options: ResolveContextOptions): ResolveContext {
  const { version, file, routeId, routeDataMap } = options;
  const logger = createPipelineLogger(options.runtime);

  return {
    version,
    file,
    logger,
    getRouteData: <T = unknown>(targetRouteId: string) => {
      const exists = targetRouteId in routeDataMap;
      // Add dependency.resolve event to the currently active resolve span
      trace.getActiveSpan()?.addEvent("dependency.resolve", {
        "route.id": routeId,
        "depends.on.route.id": targetRouteId,
        "dependency.status": exists ? "resolved" : "missing",
        "pipeline.version": version,
      });
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
}

interface ExecuteParseResolveOptions {
  file: FileContext;
  routeId: string;
  pipelineId: string;
  version: string;
  parser: (ctx: ReturnType<typeof createParseContext>) => AsyncIterable<ParsedRow>;
  filter?: PipelineFilter;
  transforms?: readonly PipelineTransformDefinition<any, any>[];
  resolveContext: ResolveContext;
  resolver: (ctx: ResolveContext, rows: AsyncIterable<ParsedRow>) => Promise<unknown>;
  runtime: PipelineExecutionRuntime;
  source: SourceAdapter;
}

async function executeParseResolve(options: ExecuteParseResolveOptions): Promise<unknown[]> {
  const { file, routeId, pipelineId, version, parser, filter, transforms, resolveContext, resolver, runtime, source } = options;

  return runtime.startSpan("parse", async (parseSpan) => {
    parseSpan.setAttributes({
      "pipeline.id": pipelineId,
      "pipeline.version": version,
      "route.id": routeId,
      "file.path": file.path,
      "file.name": file.name,
      "file.dir": file.dir,
      "file.ext": file.ext,
      "file.version": file.version,
    });

    const parseCtx = createParseContext(file, source, runtime);
    const parsedRows = parser(parseCtx);

    const collectedRows: ParsedRow[] = [];
    const filteredRows: ParsedRow[] = [];
    const filteredRowsIter = filterRows(parsedRows, file, filter, runtime, collectedRows, filteredRows);

    const resolverRows = (transforms && transforms.length > 0)
      ? applyTransforms({ version, file, logger: createPipelineLogger(runtime) }, filteredRowsIter, transforms)
      : filteredRowsIter;

    const outputArray = await runtime.startSpan("resolve", async (resolveSpan) => {
      resolveSpan.setAttributes({
        "pipeline.id": pipelineId,
        "pipeline.version": version,
        "route.id": routeId,
        "file.path": file.path,
        "file.name": file.name,
        "file.dir": file.dir,
        "file.ext": file.ext,
        "file.version": file.version,
      });

      const outputs = await resolver(resolveContext, resolverRows as AsyncIterable<ParsedRow>);
      const arr = Array.isArray(outputs) ? outputs : [outputs];
      resolveSpan.setAttribute("output.count", arr.length);
      return arr;
    }) as unknown[];

    // Set row counts after the resolver has lazily consumed the parse iterator
    parseSpan.setAttributes({
      "row.count": collectedRows.length,
      "filtered.row.count": filteredRows.length,
    });

    return outputArray;
  }) as Promise<unknown[]>;
}

export async function processRoute(options: ProcessRouteOptions): Promise<ProcessRouteResult> {
  const { file, route, routeDataMap, runtime, source, version, pipelineId } = options;

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
    pipelineId,
    version,
    parser: route.parser,
    filter: route.filter,
    transforms: route.transforms,
    resolveContext,
    resolver: route.resolver,
    runtime,
    source,
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
  pipelineId: string;
}

export async function processFallback(options: ProcessFallbackOptions): Promise<unknown[]> {
  const { file, fallback, routeDataMap, runtime, source, version, pipelineId } = options;

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
    pipelineId,
    version,
    parser: fallback.parser,
    filter: fallback.filter,
    resolveContext,
    resolver: fallback.resolver,
    runtime,
    source,
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

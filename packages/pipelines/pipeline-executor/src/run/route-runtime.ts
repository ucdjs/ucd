import type { ArtifactDefinition } from "@ucdjs/pipelines-artifacts";
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
import { isGlobalArtifact } from "@ucdjs/pipelines-artifacts";
import { applyTransforms } from "@ucdjs/pipelines-core";
import { createPipelineLogger } from "../internal/logger";
import { createParseContext } from "./source-files";

export interface ProcessRouteResult {
  outputs: unknown[];
  emittedArtifacts: Record<string, unknown>;
  consumedArtifactIds: string[];
}

export interface ProcessRouteOptions {
  file: FileContext;
  route: AnyPipelineRouteDefinition;
  artifactsMap: Record<string, unknown>;
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
  artifactsMap: Record<string, unknown>;
  emittedArtifacts: Record<string, unknown>;
  emitsDefinition?: Record<string, ArtifactDefinition>;
  onArtifactEmit?: (id: string, value: unknown) => void;
  onArtifactGet?: (id: string) => void;
}

export function createRouteResolveContext(
  options: ResolveContextOptions,
): RouteResolveContext<string, Record<string, ArtifactDefinition>> {
  const { version, file, routeId, runtime, artifactsMap, emittedArtifacts, emitsDefinition, onArtifactEmit, onArtifactGet } = options;
  const logger = createPipelineLogger(runtime);

  return {
    version,
    file,
    logger,
    getArtifact: <K extends string>(key: K): unknown => {
      if (!(key in artifactsMap)) {
        throw new Error(`Artifact "${key}" not found. Make sure a route that produces this artifact runs before route "${routeId}".`);
      }
      onArtifactGet?.(key);
      return artifactsMap[key];
    },
    emitArtifact: <K extends string>(id: K, value: unknown): void => {
      if (emitsDefinition) {
        const def = emitsDefinition[id];
        if (def) {
          const result = def.schema.safeParse(value);
          if (!result.success) {
            throw new Error(`Artifact "${id}" validation failed: ${result.error.message}`);
          }
        }
      }
      emittedArtifacts[id] = value;
      onArtifactEmit?.(id, value);
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
  resolveContext: RouteResolveContext<string, Record<string, ArtifactDefinition>>;
  resolver: (ctx: RouteResolveContext<string, Record<string, ArtifactDefinition>>, rows: AsyncIterable<ParsedRow>) => Promise<unknown>;
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
  const { file, route, artifactsMap, runtime, source, version, emit, spanId } = options;

  const emittedArtifacts: Record<string, unknown> = {};
  const consumedArtifactIds: string[] = [];

  const resolveSpanId = spanId();
  const resolveContext = createRouteResolveContext({
    version,
    file,
    routeId: route.id,
    runtime,
    artifactsMap,
    emittedArtifacts,
    emitsDefinition: route.emits,
    onArtifactEmit: async (id) => {
      await emitInSpan(runtime, resolveSpanId, emit, {
        type: "artifact:produced",
        artifactId: `${route.id}:${id}`,
        routeId: route.id,
        version,
        spanId: resolveSpanId,
        timestamp: performance.now(),
      });
    },
    onArtifactGet: async (id) => {
      if (!consumedArtifactIds.includes(id)) {
        consumedArtifactIds.push(id);
        await emitInSpan(runtime, resolveSpanId, emit, {
          type: "artifact:consumed",
          artifactId: id,
          routeId: route.id,
          version,
          spanId: resolveSpanId,
          timestamp: performance.now(),
        });
      }
    },
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
      // First call returns the pre-allocated resolveSpanId, subsequent calls generate new ones
      return options.spanId();
    },
  });

  return { outputs, emittedArtifacts, consumedArtifactIds };
}

export interface ProcessFallbackOptions {
  file: FileContext;
  fallback: FallbackRouteDefinition;
  artifactsMap: Record<string, unknown>;
  runtime: PipelineExecutionRuntime;
  source: SourceAdapter;
  version: string;
  emit: (event: PipelineEventInput) => Promise<void>;
  spanId: () => string;
}

export async function processFallback(options: ProcessFallbackOptions): Promise<unknown[]> {
  const { file, fallback, artifactsMap, runtime, source, version, emit, spanId } = options;

  const emittedArtifacts: Record<string, unknown> = {};

  const resolveContext = createRouteResolveContext({
    version,
    file,
    routeId: "__fallback__",
    runtime,
    artifactsMap,
    emittedArtifacts,
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

export function recordEmittedArtifacts(options: {
  routeId: string;
  emittedArtifacts: Record<string, unknown>;
  routeEmits: Record<string, ArtifactDefinition> | undefined;
  artifactsMap: Record<string, unknown>;
  globalArtifactsMap: Record<string, unknown>;
}): void {
  const { routeId, emittedArtifacts, routeEmits, artifactsMap, globalArtifactsMap } = options;

  for (const [artifactName, artifactValue] of Object.entries(emittedArtifacts)) {
    const prefixedKey = `${routeId}:${artifactName}`;
    const artifactDef = routeEmits?.[artifactName];

    if (artifactDef && isGlobalArtifact(artifactDef)) {
      globalArtifactsMap[prefixedKey] = artifactValue;
    } else {
      artifactsMap[prefixedKey] = artifactValue;
    }
  }
}

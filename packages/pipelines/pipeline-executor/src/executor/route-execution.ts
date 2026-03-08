import type { ArtifactDefinition } from "@ucdjs/pipelines-artifacts";
import type {
  FallbackRouteDefinition,
  FileContext,
  ParsedRow,
  PipelineEventInput,
  PipelineFilter,
  PipelineRouteDefinition,
  ResolvedEntry,
  RouteResolveContext,
} from "@ucdjs/pipelines-core";
import type { PipelineExecutionRuntime } from "../runtime";
import type { SourceAdapter } from "./source-adapter";
import { isGlobalArtifact } from "@ucdjs/pipelines-artifacts";
import { applyTransforms } from "@ucdjs/pipelines-core";
import { createPipelineLogger } from "../logger";
import { createParseContext } from "./source-adapter";

export interface ProcessRouteResult {
  outputs: unknown[];
  emittedArtifacts: Record<string, unknown>;
  consumedArtifactIds: string[];
}

export interface ProcessRouteOptions {
  file: FileContext;
  route: PipelineRouteDefinition<any, any, any, any, any>;
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

export async function processRoute(options: ProcessRouteOptions): Promise<ProcessRouteResult> {
  const { file, route, artifactsMap, runtime, source, version, emit, spanId } = options;
  const parseStartTime = performance.now();
  const parseSpanId = spanId();
  await runtime.withSpan(parseSpanId, async () => {
    await emit({
      type: "parse:start",
      file,
      routeId: route.id,
      spanId: parseSpanId,
      timestamp: performance.now(),
    });
  });

  const parseCtx = createParseContext(file, source, runtime);
  let rows: AsyncIterable<unknown> = route.parser(parseCtx);

  const collectedRows: ParsedRow[] = [];
  const filteredRows = filterRows(rows as AsyncIterable<ParsedRow>, file, route.filter, runtime, collectedRows);

  if (route.transforms && route.transforms.length > 0) {
    const logger = createPipelineLogger(runtime);
    rows = applyTransforms(
      { version, file, logger },
      filteredRows,
      route.transforms,
    );
  } else {
    rows = filteredRows;
  }

  await runtime.withSpan(parseSpanId, async () => {
    await emit({
      type: "parse:end",
      file,
      routeId: route.id,
      rowCount: collectedRows.length,
      durationMs: performance.now() - parseStartTime,
      spanId: parseSpanId,
      timestamp: performance.now(),
    });
  });

  const resolveStartTime = performance.now();
  const resolveSpanId = spanId();
  await runtime.withSpan(resolveSpanId, async () => {
    await emit({
      type: "resolve:start",
      file,
      routeId: route.id,
      spanId: resolveSpanId,
      timestamp: performance.now(),
    });
  });

  const emittedArtifacts: Record<string, unknown> = {};
  const consumedArtifactIds: string[] = [];

  const resolveCtx = createRouteResolveContext({
    version,
    file,
    routeId: route.id,
    runtime,
    artifactsMap,
    emittedArtifacts,
    emitsDefinition: route.emits,
    onArtifactEmit: async (id) => {
      await runtime.withSpan(resolveSpanId, async () => {
        await emit({
          type: "artifact:produced",
          artifactId: `${route.id}:${id}`,
          routeId: route.id,
          version,
          spanId: resolveSpanId,
          timestamp: performance.now(),
        });
      });
    },
    onArtifactGet: async (id) => {
      if (!consumedArtifactIds.includes(id)) {
        consumedArtifactIds.push(id);
        await runtime.withSpan(resolveSpanId, async () => {
          await emit({
            type: "artifact:consumed",
            artifactId: id,
            routeId: route.id,
            version,
            spanId: resolveSpanId,
            timestamp: performance.now(),
          });
        });
      }
    },
  });

  const outputs = await route.resolver(resolveCtx, rows as AsyncIterable<ParsedRow>);
  const outputArray = Array.isArray(outputs) ? outputs : [outputs];

  await runtime.withSpan(resolveSpanId, async () => {
    await emit({
      type: "resolve:end",
      file,
      routeId: route.id,
      outputCount: outputArray.length,
      durationMs: performance.now() - resolveStartTime,
      spanId: resolveSpanId,
      timestamp: performance.now(),
    });
  });

  return { outputs: outputArray, emittedArtifacts, consumedArtifactIds };
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
  const parseStartTime = performance.now();
  const parseSpanId = spanId();
  await runtime.withSpan(parseSpanId, async () => {
    await emit({
      type: "parse:start",
      file,
      routeId: "__fallback__",
      spanId: parseSpanId,
      timestamp: performance.now(),
    });
  });

  const parseCtx = createParseContext(file, source, runtime);
  const rows = fallback.parser(parseCtx);

  const collectedRows: ParsedRow[] = [];
  const filteredRows = filterRows(rows, file, fallback.filter, runtime, collectedRows);

  await runtime.withSpan(parseSpanId, async () => {
    await emit({
      type: "parse:end",
      file,
      routeId: "__fallback__",
      rowCount: collectedRows.length,
      durationMs: performance.now() - parseStartTime,
      spanId: parseSpanId,
      timestamp: performance.now(),
    });
  });

  const resolveStartTime = performance.now();
  const resolveSpanId = spanId();
  await runtime.withSpan(resolveSpanId, async () => {
    await emit({
      type: "resolve:start",
      file,
      routeId: "__fallback__",
      spanId: resolveSpanId,
      timestamp: performance.now(),
    });
  });

  const emittedArtifacts: Record<string, unknown> = {};

  const resolveCtx = {
    version,
    file,
    logger: createPipelineLogger(runtime),
    getArtifact: <K extends string>(id: K): unknown => {
      if (!(id in artifactsMap)) {
        throw new Error(`Artifact "${String(id)}" not found.`);
      }
      return artifactsMap[id];
    },
    emitArtifact: <K extends string, V>(id: K, value: V): void => {
      emittedArtifacts[id] = value;
    },
    normalizeEntries: (entries: ResolvedEntry[]) => {
      return entries.sort((a, b) => {
        const aStart = a.range?.split("..")[0] ?? a.codePoint ?? "";
        const bStart = b.range?.split("..")[0] ?? b.codePoint ?? "";
        return aStart.localeCompare(bStart);
      });
    },
    now: () => new Date().toISOString(),
  };

  const outputs = await fallback.resolver(resolveCtx, filteredRows);
  const outputArray = Array.isArray(outputs) ? outputs : [outputs];

  await runtime.withSpan(resolveSpanId, async () => {
    await emit({
      type: "resolve:end",
      file,
      routeId: "__fallback__",
      outputCount: outputArray.length,
      durationMs: performance.now() - resolveStartTime,
      spanId: resolveSpanId,
      timestamp: performance.now(),
    });
  });

  return outputArray;
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

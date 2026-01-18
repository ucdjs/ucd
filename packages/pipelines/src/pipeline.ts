import type { InferArtifactsMap, PipelineArtifactDefinition } from "./artifact";
import type { CacheEntry, CacheKey, CacheStore } from "./cache";
import { defaultHashFn, hashArtifact } from "./cache";
import type { PipelineEvent, PipelineGraph, PipelineGraphEdge, PipelineGraphNode } from "./events";
import type { PipelineRunResult, PipelineSummary } from "./results";
import type { InferRoutesOutput, PipelineRouteDefinition } from "./route";
import type {
  FileContext,
  ParseContext,
  ParsedRow,
  PipelineFilter,
  PipelineSource,
  ResolvedEntry,
  ResolveContext,
} from "./types";

export interface FallbackRouteDefinition<
  TArtifacts extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> {
  filter?: PipelineFilter;
  parser: (ctx: ParseContext) => AsyncIterable<ParsedRow>;
  resolver: (ctx: ResolveContext<TArtifacts>, rows: AsyncIterable<ParsedRow>) => Promise<TOutput>;
}

export interface PipelineOptions<
  TArtifacts extends readonly PipelineArtifactDefinition[] = readonly PipelineArtifactDefinition[],
  TRoutes extends readonly PipelineRouteDefinition[] = readonly PipelineRouteDefinition[],
> {
  versions: string[];
  source: PipelineSource;
  artifacts?: TArtifacts;
  routes: TRoutes;
  include?: PipelineFilter;
  strict?: boolean;
  concurrency?: number;
  cacheStore?: CacheStore;
  fallback?: FallbackRouteDefinition<InferArtifactsMap<TArtifacts>>;
  onEvent?: (event: PipelineEvent) => void | Promise<void>;
}

export interface PipelineRunOptions {
  cache?: boolean;
}

export interface Pipeline<TOutput = unknown> {
  run: (options?: PipelineRunOptions) => Promise<PipelineRunResult<TOutput>>;
}

type InferPipelineOutput<
  TRoutes extends readonly PipelineRouteDefinition[],
  TFallback extends FallbackRouteDefinition<any, unknown> | undefined,
> = TFallback extends FallbackRouteDefinition<any, infer TFallbackOutput>
  ? InferRoutesOutput<TRoutes> | TFallbackOutput
  : InferRoutesOutput<TRoutes>;

export function definePipeline<
  const TArtifacts extends readonly PipelineArtifactDefinition[],
  const TRoutes extends readonly PipelineRouteDefinition[],
  TFallback extends FallbackRouteDefinition<InferArtifactsMap<TArtifacts>, unknown> | undefined = undefined,
>(
  options: PipelineOptions<TArtifacts, TRoutes> & { fallback?: TFallback },
): Pipeline<InferPipelineOutput<TRoutes, TFallback>> {
  return createPipelineExecutor(options);
}

function createPipelineExecutor<TOutput>(
  options: PipelineOptions,
): Pipeline<TOutput> {
  const {
    versions,
    source,
    artifacts = [],
    routes,
    include,
    strict = false,
    concurrency = 4,
    cacheStore,
    fallback,
    onEvent,
  } = options;

  async function emit(event: PipelineEvent): Promise<void> {
    if (onEvent) {
      await onEvent(event);
    }
  }

  async function buildCacheKey(
    routeId: string,
    version: string,
    file: FileContext,
    fileContent: string,
    artifactsMap: Record<string, unknown>,
    consumedArtifactIds: string[],
  ): Promise<CacheKey> {
    const artifactHashes: Record<string, string> = {};
    for (const id of consumedArtifactIds) {
      if (id in artifactsMap) {
        artifactHashes[id] = hashArtifact(artifactsMap[id]);
      }
    }

    return {
      routeId,
      version,
      inputHash: defaultHashFn(fileContent),
      artifactHashes,
    };
  }

  async function run(runOptions: PipelineRunOptions = {}): Promise<PipelineRunResult<TOutput>> {
    const { cache: enableCache = true } = runOptions;
    const useCache = enableCache && cacheStore != null;

    const startTime = performance.now();
    const graphNodes: PipelineGraphNode[] = [];
    const graphEdges: PipelineGraphEdge[] = [];
    const allOutputs: TOutput[] = [];
    const errors: PipelineRunResult<TOutput>["errors"] = [];

    let totalFiles = 0;
    let matchedFiles = 0;
    let skippedFiles = 0;
    let fallbackFiles = 0;

    await emit({ type: "pipeline:start", versions, timestamp: Date.now() });

    for (const version of versions) {
      const versionStartTime = performance.now();
      await emit({ type: "version:start", version, timestamp: Date.now() });

      const sourceNodeId = `source:${version}`;
      graphNodes.push({ id: sourceNodeId, type: "source", version });

      const artifactsMap: Record<string, unknown> = {};

      for (const artifactDef of artifacts) {
        const artifactStartTime = performance.now();
        await emit({
          type: "artifact:start",
          artifactId: artifactDef.id,
          version,
          timestamp: Date.now(),
        });

        const artifactNodeId = `artifact:${version}:${artifactDef.id}`;
        graphNodes.push({ id: artifactNodeId, type: "artifact", artifactId: artifactDef.id });
        graphEdges.push({ from: sourceNodeId, to: artifactNodeId, type: "provides" });

        try {
          let rows: AsyncIterable<ParsedRow> | undefined;

          if (artifactDef.filter && artifactDef.parser) {
            const files = await source.listFiles(version);
            for (const file of files) {
              if (artifactDef.filter({ file })) {
                const parseCtx = createParseContext(file, source);
                rows = artifactDef.parser(parseCtx);
                break;
              }
            }
          }

          const value = await artifactDef.build({ version }, rows);
          artifactsMap[artifactDef.id] = value;
        } catch (err) {
          const pipelineError = {
            scope: "artifact" as const,
            message: err instanceof Error ? err.message : String(err),
            error: err,
            artifactId: artifactDef.id,
            version,
          };
          errors.push(pipelineError);
          await emit({
            type: "error",
            error: pipelineError,
            timestamp: Date.now(),
          });
        }

        await emit({
          type: "artifact:end",
          artifactId: artifactDef.id,
          version,
          durationMs: performance.now() - artifactStartTime,
          timestamp: Date.now(),
        });
      }

      const files = await source.listFiles(version);
      totalFiles += files.length;

      const filesToProcess = include
        ? files.filter((file) => include({ file }))
        : files;

      const processingQueue = createProcessingQueue(concurrency);

      for (const file of filesToProcess) {
        await processingQueue.add(async () => {
          const fileNodeId = `file:${version}:${file.path}`;
          graphNodes.push({ id: fileNodeId, type: "file", file });
          graphEdges.push({ from: sourceNodeId, to: fileNodeId, type: "provides" });

          const matchingRoute = routes.find((route) => route.filter({ file }));

          if (matchingRoute) {
            matchedFiles++;
            const routeNodeId = `route:${version}:${matchingRoute.id}`;

            if (!graphNodes.some((n) => n.id === routeNodeId)) {
              graphNodes.push({ id: routeNodeId, type: "route", routeId: matchingRoute.id });
            }

            graphEdges.push({ from: fileNodeId, to: routeNodeId, type: "matched" });

            await emit({
              type: "file:matched",
              file,
              routeId: matchingRoute.id,
              timestamp: Date.now(),
            });

            try {
              const routeCacheEnabled = useCache && matchingRoute.cache !== false;
              let result: ProcessRouteResult | null = null;
              let cacheHit = false;

              if (routeCacheEnabled && cacheStore) {
                const fileContent = await source.readFile(file);
                const inputHash = defaultHashFn(fileContent);

                const partialKey: CacheKey = {
                  routeId: matchingRoute.id,
                  version,
                  inputHash,
                  artifactHashes: {},
                };

                const cachedEntry = await cacheStore.get(partialKey);

                if (cachedEntry) {
                  const currentArtifactHashes: Record<string, string> = {};
                  for (const id of Object.keys(cachedEntry.key.artifactHashes)) {
                    if (id in artifactsMap) {
                      currentArtifactHashes[id] = hashArtifact(artifactsMap[id]);
                    }
                  }

                  const artifactHashesMatch = Object.keys(cachedEntry.key.artifactHashes).every(
                    (id) => currentArtifactHashes[id] === cachedEntry.key.artifactHashes[id],
                  );

                  if (artifactHashesMatch) {
                    cacheHit = true;
                    result = {
                      outputs: cachedEntry.output,
                      emittedArtifacts: cachedEntry.producedArtifacts,
                      consumedArtifactIds: Object.keys(cachedEntry.key.artifactHashes),
                    };

                    await emit({
                      type: "cache:hit",
                      routeId: matchingRoute.id,
                      file,
                      version,
                      timestamp: Date.now(),
                    });
                  }
                }

                if (!cacheHit) {
                  await emit({
                    type: "cache:miss",
                    routeId: matchingRoute.id,
                    file,
                    version,
                    timestamp: Date.now(),
                  });
                }
              }

              if (!result) {
                result = await processRoute(
                  file,
                  matchingRoute,
                  artifactsMap,
                  source,
                  version,
                  emit,
                );

                if (routeCacheEnabled && cacheStore) {
                  const fileContent = await source.readFile(file);
                  const cacheKey = await buildCacheKey(
                    matchingRoute.id,
                    version,
                    file,
                    fileContent,
                    artifactsMap,
                    result.consumedArtifactIds,
                  );

                  const cacheEntry: CacheEntry = {
                    key: cacheKey,
                    output: result.outputs,
                    producedArtifacts: result.emittedArtifacts,
                    createdAt: new Date().toISOString(),
                  };

                  await cacheStore.set(cacheEntry);

                  await emit({
                    type: "cache:store",
                    routeId: matchingRoute.id,
                    file,
                    version,
                    timestamp: Date.now(),
                  });
                }
              }

              Object.assign(artifactsMap, result.emittedArtifacts);

              for (const output of result.outputs) {
                const outputIndex = allOutputs.length;
                allOutputs.push(output as TOutput);

                const outputNodeId = `output:${version}:${outputIndex}`;
                graphNodes.push({
                  id: outputNodeId,
                  type: "output",
                  outputIndex,
                  property: (output as { property?: string }).property,
                });
                graphEdges.push({ from: routeNodeId, to: outputNodeId, type: "resolved" });
              }
            } catch (err) {
              const pipelineError = {
                scope: "route" as const,
                message: err instanceof Error ? err.message : String(err),
                error: err,
                file,
                routeId: matchingRoute.id,
                version,
              };
              errors.push(pipelineError);
              await emit({
                type: "error",
                error: pipelineError,
                timestamp: Date.now(),
              });
            }
          } else if (fallback) {
            const shouldUseFallback = !fallback.filter || fallback.filter({ file });

            if (shouldUseFallback) {
              fallbackFiles++;

              await emit({
                type: "file:fallback",
                file,
                timestamp: Date.now(),
              });

              try {
                const outputs = await processFallback(
                  file,
                  fallback,
                  artifactsMap,
                  source,
                  version,
                  emit,
                );

                for (const output of outputs) {
                  const outputIndex = allOutputs.length;
                  allOutputs.push(output as TOutput);

                  const outputNodeId = `output:${version}:${outputIndex}`;
                  graphNodes.push({
                    id: outputNodeId,
                    type: "output",
                    outputIndex,
                    property: (output as { property?: string }).property,
                  });
                  graphEdges.push({ from: fileNodeId, to: outputNodeId, type: "resolved" });
                }
              } catch (err) {
                const pipelineError = {
                  scope: "file" as const,
                  message: err instanceof Error ? err.message : String(err),
                  error: err,
                  file,
                  version,
                };
                errors.push(pipelineError);
                await emit({
                  type: "error",
                  error: pipelineError,
                  timestamp: Date.now(),
                });
              }
            } else {
              skippedFiles++;
              await emit({
                type: "file:skipped",
                file,
                reason: "filtered",
                timestamp: Date.now(),
              });
            }
          } else {
            skippedFiles++;

            if (strict) {
              const pipelineError = {
                scope: "file" as const,
                message: `No matching route for file: ${file.path}`,
                file,
                version,
              };
              errors.push(pipelineError);
              await emit({
                type: "error",
                error: pipelineError,
                timestamp: Date.now(),
              });
            } else {
              await emit({
                type: "file:skipped",
                file,
                reason: "no-match",
                timestamp: Date.now(),
              });
            }
          }
        });
      }

      await processingQueue.drain();

      await emit({
        type: "version:end",
        version,
        durationMs: performance.now() - versionStartTime,
        timestamp: Date.now(),
      });
    }

    const durationMs = performance.now() - startTime;

    await emit({
      type: "pipeline:end",
      durationMs,
      timestamp: Date.now(),
    });

    const summary: PipelineSummary = {
      versions,
      totalFiles,
      matchedFiles,
      skippedFiles,
      fallbackFiles,
      totalOutputs: allOutputs.length,
      durationMs,
    };

    const graph: PipelineGraph = {
      nodes: graphNodes,
      edges: graphEdges,
    };

    return {
      data: allOutputs,
      graph,
      errors,
      summary,
    };
  }

  return { run };
}

function createParseContext(file: FileContext, source: PipelineSource): ParseContext {
  let cachedContent: string | null = null;

  return {
    file,
    readContent: async () => {
      if (cachedContent === null) {
        cachedContent = await source.readFile(file);
      }
      return cachedContent;
    },
    readLines: async function* () {
      const content = await source.readFile(file);
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        yield line;
      }
    },
    isComment: (line: string) => line.startsWith("#") || line.trim() === "",
  };
}

interface ResolveContextOptions<TArtifacts extends Record<string, unknown>> {
  version: string;
  file: FileContext;
  routeId: string;
  artifactsMap: TArtifacts;
  emittedArtifacts: Record<string, unknown>;
  onArtifactEmit?: (id: string, value: unknown) => void;
  onArtifactGet?: (id: string) => void;
}

function createResolveContext<TArtifacts extends Record<string, unknown>>(
  options: ResolveContextOptions<TArtifacts>,
): ResolveContext<TArtifacts> {
  const { version, file, routeId, artifactsMap, emittedArtifacts, onArtifactEmit, onArtifactGet } = options;

  return {
    version,
    file,
    getArtifact: <K extends keyof TArtifacts>(id: K): TArtifacts[K] => {
      if (!(id in artifactsMap)) {
        throw new Error(`Artifact "${String(id)}" not found. Make sure a route that produces this artifact runs before route "${routeId}".`);
      }
      onArtifactGet?.(String(id));
      return artifactsMap[id];
    },
    emitArtifact: <K extends string, V>(id: K, value: V): void => {
      emittedArtifacts[id] = value;
      onArtifactEmit?.(id, value);
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
}

interface ProcessRouteResult {
  outputs: unknown[];
  emittedArtifacts: Record<string, unknown>;
  consumedArtifactIds: string[];
}

async function processRoute(
  file: FileContext,
  route: PipelineRouteDefinition,
  artifactsMap: Record<string, unknown>,
  source: PipelineSource,
  version: string,
  emit: (event: PipelineEvent) => Promise<void>,
): Promise<ProcessRouteResult> {
  const parseStartTime = performance.now();
  await emit({
    type: "parse:start",
    file,
    routeId: route.id,
    timestamp: Date.now(),
  });

  const parseCtx = createParseContext(file, source);
  const rows = route.parser(parseCtx);

  const collectedRows: ParsedRow[] = [];
  const filteredRows = filterRows(rows, file, route.filter, collectedRows);

  await emit({
    type: "parse:end",
    file,
    routeId: route.id,
    rowCount: collectedRows.length,
    durationMs: performance.now() - parseStartTime,
    timestamp: Date.now(),
  });

  const resolveStartTime = performance.now();
  await emit({
    type: "resolve:start",
    file,
    routeId: route.id,
    timestamp: Date.now(),
  });

  const emittedArtifacts: Record<string, unknown> = {};
  const consumedArtifactIds: string[] = [];

  const resolveCtx = createResolveContext({
    version,
    file,
    routeId: route.id,
    artifactsMap,
    emittedArtifacts,
    onArtifactEmit: async (id) => {
      await emit({
        type: "artifact:produced",
        artifactId: id,
        routeId: route.id,
        version,
        timestamp: Date.now(),
      });
    },
    onArtifactGet: async (id) => {
      if (!consumedArtifactIds.includes(id)) {
        consumedArtifactIds.push(id);
        await emit({
          type: "artifact:consumed",
          artifactId: id,
          routeId: route.id,
          version,
          timestamp: Date.now(),
        });
      }
    },
  });
  const outputs = await route.resolver(resolveCtx, filteredRows);

  const outputArray = Array.isArray(outputs) ? outputs : [outputs];

  await emit({
    type: "resolve:end",
    file,
    routeId: route.id,
    outputCount: outputArray.length,
    durationMs: performance.now() - resolveStartTime,
    timestamp: Date.now(),
  });

  return { outputs: outputArray, emittedArtifacts, consumedArtifactIds };
}

async function processFallback(
  file: FileContext,
  fallback: FallbackRouteDefinition,
  artifactsMap: Record<string, unknown>,
  source: PipelineSource,
  version: string,
  emit: (event: PipelineEvent) => Promise<void>,
): Promise<unknown[]> {
  const parseStartTime = performance.now();
  await emit({
    type: "parse:start",
    file,
    routeId: "__fallback__",
    timestamp: Date.now(),
  });

  const parseCtx = createParseContext(file, source);
  const rows = fallback.parser(parseCtx);

  const collectedRows: ParsedRow[] = [];
  const filteredRows = filterRows(rows, file, fallback.filter, collectedRows);

  await emit({
    type: "parse:end",
    file,
    routeId: "__fallback__",
    rowCount: collectedRows.length,
    durationMs: performance.now() - parseStartTime,
    timestamp: Date.now(),
  });

  const resolveStartTime = performance.now();
  await emit({
    type: "resolve:start",
    file,
    routeId: "__fallback__",
    timestamp: Date.now(),
  });

  const emittedArtifacts: Record<string, unknown> = {};

  const resolveCtx = createResolveContext({
    version,
    file,
    routeId: "__fallback__",
    artifactsMap,
    emittedArtifacts,
  });
  const outputs = await fallback.resolver(resolveCtx, filteredRows);

  const outputArray = Array.isArray(outputs) ? outputs : [outputs];

  await emit({
    type: "resolve:end",
    file,
    routeId: "__fallback__",
    outputCount: outputArray.length,
    durationMs: performance.now() - resolveStartTime,
    timestamp: Date.now(),
  });

  return outputArray;
}

async function* filterRows(
  rows: AsyncIterable<ParsedRow>,
  file: FileContext,
  filter: PipelineFilter | undefined,
  collector: ParsedRow[],
): AsyncIterable<ParsedRow> {
  for await (const row of rows) {
    collector.push(row);

    if (!filter) {
      yield row;
      continue;
    }

    const shouldInclude = filter({
      file,
      row: { property: row.property },
    });

    if (shouldInclude) {
      yield row;
    }
  }
}

interface ProcessingQueue {
  add: (task: () => Promise<void>) => Promise<void>;
  drain: () => Promise<void>;
}

function createProcessingQueue(concurrency: number): ProcessingQueue {
  const queue: (() => Promise<void>)[] = [];
  let running = 0;
  let resolveIdle: (() => void) | null = null;

  async function runNext(): Promise<void> {
    if (running >= concurrency || queue.length === 0) {
      if (running === 0 && queue.length === 0 && resolveIdle) {
        resolveIdle();
      }
      return;
    }

    running++;
    const task = queue.shift()!;

    try {
      await task();
    } finally {
      running--;
      runNext();
    }
  }

  return {
    add: async (task) => {
      queue.push(task);
      runNext();
    },
    drain: () => {
      if (running === 0 && queue.length === 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        resolveIdle = resolve;
      });
    },
  };
}

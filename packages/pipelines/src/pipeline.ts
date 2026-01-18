import type { InferArtifactsMap, PipelineArtifactDefinition } from "./artifact";
import type { ArtifactDefinition } from "./artifact-schema";
import { isGlobalArtifact } from "./artifact-schema";
import type { CacheEntry, CacheKey, CacheStore } from "./cache";
import { defaultHashFn, hashArtifact } from "./cache";
import { buildDAG, getExecutionLayers } from "./dag";
import type { PipelineEvent, PipelineGraph, PipelineGraphEdge, PipelineGraphNode } from "./events";
import type { PipelineRunResult, PipelineSummary } from "./results";
import type { InferRoutesOutput, PipelineRouteDefinition, RouteResolveContext } from "./route";
import type { PipelineSourceDefinition, SourceBackend, SourceFileContext } from "./source";
import { resolveMultipleSourceFiles } from "./source";
import { applyTransforms } from "./transform";
import type {
  FileContext,
  ParseContext,
  ParsedRow,
  PipelineFilter,
  ResolvedEntry,
  ResolveContext,
} from "./types";

interface SourceAdapter {
  listFiles: (version: string) => Promise<FileContext[]>;
  readFile: (file: FileContext) => Promise<string>;
}

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
  TRoutes extends readonly PipelineRouteDefinition<any, any, any, any, any>[] = readonly PipelineRouteDefinition<any, any, any, any, any>[],
> {
  versions: string[];
  inputs: PipelineSourceDefinition[];
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
  versions?: string[];
}

export interface Pipeline<TOutput = unknown> {
  run: (options?: PipelineRunOptions) => Promise<PipelineRunResult<TOutput>>;
}

type InferPipelineOutput<
  TRoutes extends readonly PipelineRouteDefinition<any, any, any, any, any>[],
  TFallback extends FallbackRouteDefinition<any, unknown> | undefined,
> = TFallback extends FallbackRouteDefinition<any, infer TFallbackOutput>
  ? InferRoutesOutput<TRoutes> | TFallbackOutput
  : InferRoutesOutput<TRoutes>;

export function definePipeline<
  const TArtifacts extends readonly PipelineArtifactDefinition[],
  const TRoutes extends readonly PipelineRouteDefinition<any, any, any, any, any>[],
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
    inputs,
    artifacts = [],
    routes,
    include,
    strict = false,
    concurrency = 4,
    cacheStore,
    fallback,
    onEvent,
  } = options;

  const dagResult = buildDAG(routes);
  if (!dagResult.valid) {
    throw new Error(`Pipeline DAG validation failed:\n${dagResult.errors.map((e) => `  - ${e.message}`).join("\n")}`);
  }
  const dag = dagResult.dag!;

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

  function createSourceAdapter(): SourceAdapter {
    if (inputs.length === 0) {
      throw new Error("Pipeline requires at least one input source");
    }

    const backends = new Map<string, SourceBackend>();
    for (const input of inputs) {
      backends.set(input.id, input.backend);
    }

    return {
      listFiles: async (version: string) => {
        return resolveMultipleSourceFiles(inputs, version);
      },
      readFile: async (file: FileContext) => {
        const sourceFile = file as SourceFileContext;
        if (sourceFile.source) {
          const backend = backends.get(sourceFile.source.id);
          if (backend) {
            return backend.readFile(file);
          }
        }
        const firstBackend = backends.values().next().value;
        if (firstBackend) {
          return firstBackend.readFile(file);
        }
        throw new Error(`No backend found for file: ${file.path}`);
      },
    };
  }

  async function run(runOptions: PipelineRunOptions = {}): Promise<PipelineRunResult<TOutput>> {
    const { cache: enableCache = true, versions: runVersions } = runOptions;
    const useCache = enableCache && cacheStore != null;
    const versionsToRun = runVersions ?? versions;

    const effectiveSource = createSourceAdapter();

    const startTime = performance.now();
    const graphNodes: PipelineGraphNode[] = [];
    const graphEdges: PipelineGraphEdge[] = [];
    const allOutputs: TOutput[] = [];
    const errors: PipelineRunResult<TOutput>["errors"] = [];

    let totalFiles = 0;
    let matchedFiles = 0;
    let skippedFiles = 0;
    let fallbackFiles = 0;

    await emit({ type: "pipeline:start", versions: versionsToRun, timestamp: Date.now() });

    for (const version of versionsToRun) {
      const versionStartTime = performance.now();
      await emit({ type: "version:start", version, timestamp: Date.now() });

      const sourceNodeId = `source:${version}`;
      graphNodes.push({ id: sourceNodeId, type: "source", version });

      const artifactsMap: Record<string, unknown> = {};
      const globalArtifactsMap: Record<string, unknown> = {};

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
            const files = await effectiveSource.listFiles(version);
            for (const file of files) {
              if (artifactDef.filter({ file })) {
                const parseCtx = createParseContext(file, effectiveSource);
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

      const files = await effectiveSource.listFiles(version);
      totalFiles += files.length;

      const filesToProcess = include
        ? files.filter((file) => include({ file }))
        : files;

      const executionLayers = getExecutionLayers(dag);

      for (const layer of executionLayers) {
        const processingQueue = createProcessingQueue(concurrency);
        const layerRoutes = routes.filter((r) => layer.includes(r.id));

        for (const route of layerRoutes) {
          const matchingFiles = filesToProcess.filter((file) => {
            const sourceFile = file as SourceFileContext;
            const filterCtx = {
              file,
              source: sourceFile.source,
            };
            return route.filter(filterCtx);
          });

          for (const file of matchingFiles) {
            await processingQueue.add(async () => {
              const fileNodeId = `file:${version}:${file.path}`;
              if (!graphNodes.some((n) => n.id === fileNodeId)) {
                graphNodes.push({ id: fileNodeId, type: "file", file });
                graphEdges.push({ from: sourceNodeId, to: fileNodeId, type: "provides" });
              }

              matchedFiles++;
              const routeNodeId = `route:${version}:${route.id}`;

              if (!graphNodes.some((n) => n.id === routeNodeId)) {
                graphNodes.push({ id: routeNodeId, type: "route", routeId: route.id });
              }

              graphEdges.push({ from: fileNodeId, to: routeNodeId, type: "matched" });

              await emit({
                type: "file:matched",
                file,
                routeId: route.id,
                timestamp: Date.now(),
              });

              try {
                const routeCacheEnabled = useCache && route.cache !== false;
                let result: ProcessRouteResult | null = null;
                let cacheHit = false;

                if (routeCacheEnabled && cacheStore) {
                  const fileContent = await effectiveSource.readFile(file);
                  const inputHash = defaultHashFn(fileContent);

                  const partialKey: CacheKey = {
                    routeId: route.id,
                    version,
                    inputHash,
                    artifactHashes: {},
                  };

                  const cachedEntry = await cacheStore.get(partialKey);

                  if (cachedEntry) {
                    const currentArtifactHashes: Record<string, string> = {};
                    for (const id of Object.keys(cachedEntry.key.artifactHashes)) {
                      const combinedMap = { ...artifactsMap, ...globalArtifactsMap };
                      if (id in combinedMap) {
                        currentArtifactHashes[id] = hashArtifact(combinedMap[id]);
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
                        routeId: route.id,
                        file,
                        version,
                        timestamp: Date.now(),
                      });
                    }
                  }

                  if (!cacheHit) {
                    await emit({
                      type: "cache:miss",
                      routeId: route.id,
                      file,
                      version,
                      timestamp: Date.now(),
                    });
                  }
                }

                if (!result) {
                  result = await processRoute(
                    file,
                    route,
                    { ...artifactsMap, ...globalArtifactsMap },
                    effectiveSource,
                    version,
                    emit,
                  );

                  if (routeCacheEnabled && cacheStore) {
                    const fileContent = await effectiveSource.readFile(file);
                    const combinedMap = { ...artifactsMap, ...globalArtifactsMap };
                    const cacheKey = await buildCacheKey(
                      route.id,
                      version,
                      file,
                      fileContent,
                      combinedMap,
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
                      routeId: route.id,
                      file,
                      version,
                      timestamp: Date.now(),
                    });
                  }
                }

                for (const [artifactName, artifactValue] of Object.entries(result.emittedArtifacts)) {
                  const prefixedKey = `${route.id}:${artifactName}`;
                  const artifactDef = route.emits?.[artifactName];

                  if (artifactDef && isGlobalArtifact(artifactDef)) {
                    globalArtifactsMap[prefixedKey] = artifactValue;
                  } else {
                    artifactsMap[prefixedKey] = artifactValue;
                  }
                }

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
                  routeId: route.id,
                  version,
                };
                errors.push(pipelineError);
                await emit({
                  type: "error",
                  error: pipelineError,
                  timestamp: Date.now(),
                });
              }
            });
          }
        }

        await processingQueue.drain();
      }

      const processedFiles = new Set<string>();
      for (const route of routes) {
        for (const file of filesToProcess) {
          const sourceFile = file as SourceFileContext;
          const filterCtx = { file, source: sourceFile.source };
          if (route.filter(filterCtx)) {
            processedFiles.add(file.path);
          }
        }
      }

      for (const file of filesToProcess) {
        if (processedFiles.has(file.path)) continue;

        if (fallback) {
          const shouldUseFallback = !fallback.filter || fallback.filter({ file });

          if (shouldUseFallback) {
            fallbackFiles++;

            const fileNodeId = `file:${version}:${file.path}`;
            if (!graphNodes.some((n) => n.id === fileNodeId)) {
              graphNodes.push({ id: fileNodeId, type: "file", file });
              graphEdges.push({ from: sourceNodeId, to: fileNodeId, type: "provides" });
            }

            await emit({
              type: "file:fallback",
              file,
              timestamp: Date.now(),
            });

            try {
              const outputs = await processFallback(
                file,
                fallback,
                { ...artifactsMap, ...globalArtifactsMap },
                effectiveSource,
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
      }

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
      versions: versionsToRun,
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

function createParseContext(file: FileContext, source: SourceAdapter): ParseContext {
  let cachedContent: string | null = null;

  return {
    file,
    readContent: async () => {
      if (cachedContent === null) {
        cachedContent = await source.readFile(file);
      }
      return cachedContent!;
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

interface ResolveContextOptions {
  version: string;
  file: FileContext;
  routeId: string;
  artifactsMap: Record<string, unknown>;
  emittedArtifacts: Record<string, unknown>;
  emitsDefinition?: Record<string, ArtifactDefinition>;
  onArtifactEmit?: (id: string, value: unknown) => void;
  onArtifactGet?: (id: string) => void;
}

function createRouteResolveContext(
  options: ResolveContextOptions,
): RouteResolveContext<string, Record<string, ArtifactDefinition>> {
  const { version, file, routeId, artifactsMap, emittedArtifacts, emitsDefinition, onArtifactEmit, onArtifactGet } = options;

  return {
    version,
    file,
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

function createResolveContext<TArtifacts extends Record<string, unknown>>(
  options: Omit<ResolveContextOptions, "emitsDefinition">,
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
      return artifactsMap[id as string] as TArtifacts[K];
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
  route: PipelineRouteDefinition<any, any, any, any, any>,
  artifactsMap: Record<string, unknown>,
  source: SourceAdapter,
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
  let rows: AsyncIterable<unknown> = route.parser(parseCtx);

  const collectedRows: ParsedRow[] = [];
  const filteredRows = filterRows(rows as AsyncIterable<ParsedRow>, file, route.filter, collectedRows);

  if (route.transforms && route.transforms.length > 0) {
    rows = applyTransforms(
      { version, file },
      filteredRows,
      route.transforms,
    );
  } else {
    rows = filteredRows;
  }

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

  const resolveCtx = createRouteResolveContext({
    version,
    file,
    routeId: route.id,
    artifactsMap,
    emittedArtifacts,
    emitsDefinition: route.emits,
    onArtifactEmit: async (id) => {
      await emit({
        type: "artifact:produced",
        artifactId: `${route.id}:${id}`,
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

  const outputs = await route.resolver(resolveCtx, rows);

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
  source: SourceAdapter,
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

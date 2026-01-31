import type {
  FileContext,
  ParseContext,
  ParsedRow,
  PipelineDefinition,
  PipelineEvent,
  PipelineFilter,
  PipelineGraphEdge,
  PipelineGraphNode,
  PipelineRouteDefinition,
  RouteResolveContext,
  SourceBackend,
  SourceFileContext,
} from "@ucdjs/pipelines-core";
import { applyTransforms, resolveMultipleSourceFiles } from "@ucdjs/pipelines-core";
import type { ArtifactDefinition, PipelineArtifactDefinition } from "@ucdjs/pipelines-artifacts";
import { isGlobalArtifact } from "@ucdjs/pipelines-artifacts";
import { buildDAG, getExecutionLayers } from "@ucdjs/pipelines-graph";
import type { CacheEntry, CacheKey, CacheStore } from "./cache";
import { defaultHashFn, hashArtifact } from "./cache";
import type { MultiplePipelineRunResult, PipelineRunResult, PipelineSummary } from "./results";

interface SourceAdapter {
  listFiles: (version: string) => Promise<FileContext[]>;
  readFile: (file: FileContext) => Promise<string>;
}

export interface PipelineExecutorOptions {
  pipelines: PipelineDefinition[];
  artifacts?: PipelineArtifactDefinition[];
  cacheStore?: CacheStore;
  onEvent?: (event: PipelineEvent) => void | Promise<void>;
}

export interface PipelineExecutorRunOptions {
  cache?: boolean;
  versions?: string[];
  pipelines?: string[];
}

export interface PipelineExecutor {
  run: (options?: PipelineExecutorRunOptions) => Promise<MultiplePipelineRunResult>;
  runSingle: (pipelineId: string, options?: Omit<PipelineExecutorRunOptions, "pipelines">) => Promise<PipelineRunResult>;
}

export function createPipelineExecutor(options: PipelineExecutorOptions): PipelineExecutor {
  const {
    pipelines,
    artifacts: globalArtifacts = [],
    cacheStore,
    onEvent,
  } = options;

  const pipelinesById = new Map(pipelines.map((p) => [p.id, p]));

  async function emit(event: PipelineEvent): Promise<void> {
    if (onEvent) {
      await onEvent(event);
    }
  }

  async function runSinglePipeline(
    pipeline: PipelineDefinition,
    runOptions: Omit<PipelineExecutorRunOptions, "pipelines"> = {},
  ): Promise<PipelineRunResult> {
    const { cache: enableCache = true, versions: runVersions } = runOptions;
    const useCache = enableCache && cacheStore != null;
    const versionsToRun = runVersions ?? pipeline.versions;

    const effectiveSource = createSourceAdapter(pipeline);

    const startTime = performance.now();
    const graphNodes: PipelineGraphNode[] = [];
    const graphEdges: PipelineGraphEdge[] = [];
    const allOutputs: unknown[] = [];
    const errors: PipelineRunResult["errors"] = [];

    let totalFiles = 0;
    let matchedFiles = 0;
    let skippedFiles = 0;
    let fallbackFiles = 0;

    const dagResult = buildDAG(pipeline.routes);
    if (!dagResult.valid) {
      throw new Error(`Pipeline DAG validation failed:\n${dagResult.errors.map((e) => `  - ${e.message}`).join("\n")}`);
    }
    const dag = dagResult.dag!;

    await emit({ type: "pipeline:start", versions: versionsToRun, timestamp: Date.now() });

    for (const version of versionsToRun) {
      const versionStartTime = performance.now();
      await emit({ type: "version:start", version, timestamp: Date.now() });

      const sourceNodeId = `source:${version}`;
      graphNodes.push({ id: sourceNodeId, type: "source", version });

      const artifactsMap: Record<string, unknown> = {};
      const globalArtifactsMap: Record<string, unknown> = {};

      for (const artifactDef of globalArtifacts) {
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

      const filesToProcess = pipeline.include
        ? files.filter((file) => pipeline.include!({ file }))
        : files;

      const executionLayers = getExecutionLayers(dag);

      for (const layer of executionLayers) {
        const processingQueue = createProcessingQueue(pipeline.concurrency);
        const layerRoutes = pipeline.routes.filter((r) => layer.includes(r.id));

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
                  allOutputs.push(output);

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
      for (const route of pipeline.routes) {
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

        if (pipeline.fallback) {
          const fallback = pipeline.fallback as FallbackRouteDefinition;
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
                allOutputs.push(output);

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

          if (pipeline.strict) {
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

    return {
      data: allOutputs,
      graph: { nodes: graphNodes, edges: graphEdges },
      errors,
      summary,
    };
  }

  async function run(runOptions: PipelineExecutorRunOptions = {}): Promise<MultiplePipelineRunResult> {
    const startTime = performance.now();
    const pipelinesToRun = runOptions.pipelines
      ? pipelines.filter((p) => runOptions.pipelines!.includes(p.id))
      : pipelines;

    const results = new Map<string, PipelineRunResult>();
    let successfulPipelines = 0;
    let failedPipelines = 0;

    for (const pipeline of pipelinesToRun) {
      try {
        const result = await runSinglePipeline(pipeline, runOptions);
        results.set(pipeline.id, result);
        if (result.errors.length === 0) {
          successfulPipelines++;
        } else {
          failedPipelines++;
        }
      } catch (err) {
        failedPipelines++;
        results.set(pipeline.id, {
          data: [],
          graph: { nodes: [], edges: [] },
          errors: [{
            scope: "pipeline",
            message: err instanceof Error ? err.message : String(err),
            error: err,
          }],
          summary: {
            versions: pipeline.versions,
            totalFiles: 0,
            matchedFiles: 0,
            skippedFiles: 0,
            fallbackFiles: 0,
            totalOutputs: 0,
            durationMs: 0,
          },
        });
      }
    }

    return {
      results,
      summary: {
        totalPipelines: pipelinesToRun.length,
        successfulPipelines,
        failedPipelines,
        durationMs: performance.now() - startTime,
      },
    };
  }

  return {
    run,
    runSingle: (pipelineId, options) => {
      const pipeline = pipelinesById.get(pipelineId);
      if (!pipeline) {
        throw new Error(`Pipeline "${pipelineId}" not found`);
      }
      return runSinglePipeline(pipeline, options);
    },
  };
}

function createSourceAdapter(pipeline: PipelineDefinition): SourceAdapter {
  if (pipeline.inputs.length === 0) {
    throw new Error("Pipeline requires at least one input source");
  }

  const backends = new Map<string, SourceBackend>();
  for (const input of pipeline.inputs) {
    backends.set(input.id, input.backend);
  }

  return {
    listFiles: async (version: string) => {
      return resolveMultipleSourceFiles(pipeline.inputs as any, version);
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

interface FallbackRouteDefinition<TArtifacts extends Record<string, unknown> = Record<string, unknown>, TOutput = unknown> {
  filter?: PipelineFilter;
  parser: (ctx: ParseContext) => AsyncIterable<ParsedRow>;
  resolver: (ctx: { version: string; file: FileContext; getArtifact: <K extends keyof TArtifacts>(id: K) => TArtifacts[K]; emitArtifact: <K extends string, V>(id: K, value: V) => void; normalizeEntries: (entries: any[]) => any[]; now: () => string }, rows: AsyncIterable<ParsedRow>) => Promise<TOutput>;
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

  const resolveCtx = {
    version,
    file,
    getArtifact: <K extends string>(id: K): unknown => {
      if (!(id in artifactsMap)) {
        throw new Error(`Artifact "${String(id)}" not found.`);
      }
      return artifactsMap[id];
    },
    emitArtifact: <K extends string, V>(id: K, value: V): void => {
      emittedArtifacts[id] = value;
    },
    normalizeEntries: (entries: any[]) => {
      return entries.sort((a: any, b: any) => {
        const aStart = a.range?.split("..")[0] ?? a.codePoint ?? "";
        const bStart = b.range?.split("..")[0] ?? b.codePoint ?? "";
        return aStart.localeCompare(bStart);
      });
    },
    now: () => new Date().toISOString(),
  };
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

async function buildCacheKey(
  routeId: string,
  version: string,
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

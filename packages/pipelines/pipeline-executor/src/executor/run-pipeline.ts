import type { PipelineArtifactDefinition } from "@ucdjs/pipelines-artifacts";
import type {
  AnyPipelineDefinition,
  FileContext,
  ParsedRow,
  PipelineError,
  PipelineEventInput,
  PipelineRouteDefinition,
  SourceFileContext,
} from "@ucdjs/pipelines-core";
import type { CacheStore } from "../cache";
import type {
  ExecutionStatus,
  PipelineExecutionResult,
  PipelineExecutorRunOptions,
  PipelineSummary,
} from "../types";
import type { EventEmitter } from "./events";
import { getExecutionLayers } from "@ucdjs/pipelines-core";
import { PipelineGraphBuilder } from "@ucdjs/pipelines-graph";
import { withPipelineSpan } from "../log-context";
import { buildCacheKey, storeCacheEntry, tryLoadCachedResult } from "./cache-helpers";
import { emitWithSpan } from "./events";
import { createProcessingQueue } from "./processing-queue";
import {
  processFallback,
  processRoute,
  recordEmittedArtifacts,
} from "./route-execution";
import { createParseContext, createSourceAdapter } from "./source-adapter";

export interface RunPipelineOptions {
  pipeline: AnyPipelineDefinition;
  runOptions?: PipelineExecutorRunOptions;
  cacheStore?: CacheStore;
  artifacts: PipelineArtifactDefinition[];
  events: EventEmitter;
}

export async function runPipeline(options: RunPipelineOptions): Promise<PipelineExecutionResult> {
  const { pipeline, runOptions = {}, cacheStore, artifacts: globalArtifacts, events } = options;
  const { cache: enableCache = true, versions: runVersions } = runOptions;
  const useCache = enableCache && cacheStore != null;
  const versionsToRun = runVersions ?? pipeline.versions;

  const source = createSourceAdapter(pipeline);
  const graph = new PipelineGraphBuilder();

  const startTime = performance.now();
  const outputs: unknown[] = [];
  const errors: PipelineError[] = [];

  let totalFiles = 0;
  let matchedFiles = 0;
  let skippedFiles = 0;
  let fallbackFiles = 0;

  const dag = pipeline.dag;

  const pipelineSpanId = events.nextSpanId();
  await emitWithSpan(pipelineSpanId, () =>
    events.emit({
      type: "pipeline:start",
      versions: versionsToRun,
      spanId: pipelineSpanId,
      timestamp: performance.now(),
    }));

  for (const version of versionsToRun) {
    const versionStartTime = performance.now();
    const versionSpanId = events.nextSpanId();
    await emitWithSpan(versionSpanId, () =>
      events.emit({
        type: "version:start",
        version,
        spanId: versionSpanId,
        timestamp: performance.now(),
      }));

    const sourceNodeId = graph.addSourceNode(version);
    const artifactsMap: Record<string, unknown> = {};
    const globalArtifactsMap: Record<string, unknown> = {};

    let versionFiles: FileContext[] | null = null;
    async function listVersionFiles(): Promise<FileContext[]> {
      if (!versionFiles) {
        versionFiles = await source.listFiles(version);
      }

      return versionFiles;
    }

    for (const artifactDef of globalArtifacts) {
      const artifactStartTime = performance.now();
      const artifactSpanId = events.nextSpanId();
      await emitWithSpan(artifactSpanId, () =>
        events.emit({
          type: "artifact:start",
          artifactId: artifactDef.id,
          version,
          spanId: artifactSpanId,
          timestamp: performance.now(),
        }));

      const artifactNodeId = graph.addArtifactNode(artifactDef.id, version);
      graph.addEdge(sourceNodeId, artifactNodeId, "provides");

      try {
        let rows: AsyncIterable<ParsedRow> | undefined;

        if (artifactDef.filter && artifactDef.parser) {
          const files = await listVersionFiles();
          for (const file of files) {
            if (artifactDef.filter({ file })) {
              rows = artifactDef.parser(createParseContext(file, source));
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
        await emitWithSpan(artifactSpanId, () =>
          events.emit({
            type: "error",
            error: pipelineError,
            spanId: artifactSpanId,
            timestamp: performance.now(),
          }));
      }

      await emitWithSpan(artifactSpanId, () =>
        events.emit({
          type: "artifact:end",
          artifactId: artifactDef.id,
          version,
          durationMs: performance.now() - artifactStartTime,
          spanId: artifactSpanId,
          timestamp: performance.now(),
        }));
    }

    const files = await listVersionFiles();
    totalFiles += files.length;

    const filesToProcess = pipeline.include
      ? files.filter((file) => pipeline.include!({ file }))
      : files;

    const executionLayers = getExecutionLayers(dag);
    const processedFiles = new Set<string>();

    for (const layer of executionLayers) {
      const processingQueue = createProcessingQueue(pipeline.concurrency);
      const layerRoutes = pipeline.routes.filter((route: PipelineRouteDefinition<any, any, any, any, any>) => layer.includes(route.id));

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
          processedFiles.add(file.path);

          await processingQueue.add(async () => {
            const fileNodeId = graph.addFileNode(file);
            graph.addEdge(sourceNodeId, fileNodeId, "provides");

            matchedFiles++;
            const routeNodeId = graph.addRouteNode(route.id, version);
            graph.addEdge(fileNodeId, routeNodeId, "matched");

            const fileSpanId = events.nextSpanId();
            await emitWithSpan(fileSpanId, () =>
              events.emit({
                type: "file:matched",
                file,
                routeId: route.id,
                spanId: fileSpanId,
                timestamp: performance.now(),
              }));

            await withPipelineSpan(fileSpanId, async () => {
              try {
                const routeCacheEnabled = useCache && route.cache !== false;
                let result = null as Awaited<ReturnType<typeof processRoute>> | null;
                let fileContent: string | undefined;

                if (routeCacheEnabled && cacheStore) {
                  fileContent = await source.readFile(file);
                  const combinedArtifacts = { ...artifactsMap, ...globalArtifactsMap };
                  const cachedResult = await tryLoadCachedResult({
                    cacheStore,
                    routeId: route.id,
                    version,
                    fileContent,
                    artifactsMap: combinedArtifacts,
                  });

                  if (cachedResult.hit && cachedResult.result) {
                    result = cachedResult.result;
                    await events.emit({
                      type: "cache:hit",
                      routeId: route.id,
                      file,
                      version,
                      spanId: fileSpanId,
                      timestamp: performance.now(),
                    });
                  } else {
                    await events.emit({
                      type: "cache:miss",
                      routeId: route.id,
                      file,
                      version,
                      spanId: fileSpanId,
                      timestamp: performance.now(),
                    });
                  }
                }

                if (!result) {
                  const combinedArtifacts = { ...artifactsMap, ...globalArtifactsMap };
                  result = await processRoute({
                    file,
                    route,
                    artifactsMap: combinedArtifacts,
                    source,
                    version,
                    emit: (event: PipelineEventInput) => events.emit({ ...event, spanId: fileSpanId }),
                    spanId: events.nextSpanId,
                  });

                  if (routeCacheEnabled && cacheStore) {
                    fileContent ??= await source.readFile(file);
                    const cacheArtifacts = { ...artifactsMap, ...globalArtifactsMap };
                    const cacheKey = await buildCacheKey(
                      route.id,
                      version,
                      fileContent,
                      cacheArtifacts,
                      result.consumedArtifactIds,
                    );

                    await storeCacheEntry({
                      cacheStore,
                      cacheKey,
                      outputs: result.outputs,
                      emittedArtifacts: result.emittedArtifacts,
                    });

                    await events.emit({
                      type: "cache:store",
                      routeId: route.id,
                      file,
                      version,
                      spanId: fileSpanId,
                      timestamp: performance.now(),
                    });
                  }
                }

                recordEmittedArtifacts({
                  routeId: route.id,
                  emittedArtifacts: result.emittedArtifacts,
                  routeEmits: route.emits,
                  artifactsMap,
                  globalArtifactsMap,
                });

                for (const output of result.outputs) {
                  const outputIndex = outputs.length;
                  outputs.push(output);

                  const outputNodeId = graph.addOutputNode(
                    outputIndex,
                    version,
                    (output as { property?: string }).property,
                  );
                  graph.addEdge(routeNodeId, outputNodeId, "resolved");
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
                await events.emit({
                  type: "error",
                  error: pipelineError,
                  spanId: fileSpanId,
                  timestamp: performance.now(),
                });
              }
            });
          });
        }
      }

      await processingQueue.drain();
    }

    for (const file of filesToProcess) {
      if (processedFiles.has(file.path)) continue;

      if (pipeline.fallback) {
        const shouldUseFallback = !pipeline.fallback.filter || pipeline.fallback.filter({ file });

        if (shouldUseFallback) {
          fallbackFiles++;

          const fileNodeId = graph.addFileNode(file);
          graph.addEdge(sourceNodeId, fileNodeId, "provides");

          const fallbackSpanId = events.nextSpanId();
          await emitWithSpan(fallbackSpanId, () =>
            events.emit({
              type: "file:fallback",
              file,
              spanId: fallbackSpanId,
              timestamp: performance.now(),
            }));

          try {
            const fallbackOutputs = await withPipelineSpan(fallbackSpanId, () => processFallback({
              file,
              fallback: pipeline.fallback!,
              artifactsMap: { ...artifactsMap, ...globalArtifactsMap },
              source,
              version,
              emit: (event: PipelineEventInput) => events.emit({ ...event, spanId: fallbackSpanId }),
              spanId: events.nextSpanId,
            }));

            for (const output of fallbackOutputs) {
              const outputIndex = outputs.length;
              outputs.push(output);

              const outputNodeId = graph.addOutputNode(
                outputIndex,
                version,
                (output as { property?: string }).property,
              );
              graph.addEdge(fileNodeId, outputNodeId, "resolved");
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
            await emitWithSpan(fallbackSpanId, () =>
              events.emit({
                type: "error",
                error: pipelineError,
                spanId: fallbackSpanId,
                timestamp: performance.now(),
              }));
          }
        } else {
          skippedFiles++;
          await emitWithSpan(versionSpanId, () =>
            events.emit({
              type: "file:skipped",
              file,
              reason: "filtered",
              spanId: versionSpanId,
              timestamp: performance.now(),
            }));
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
          await emitWithSpan(versionSpanId, () =>
            events.emit({
              type: "error",
              error: pipelineError,
              spanId: versionSpanId,
              timestamp: performance.now(),
            }));
        } else {
          await emitWithSpan(versionSpanId, () =>
            events.emit({
              type: "file:skipped",
              file,
              reason: "no-match",
              spanId: versionSpanId,
              timestamp: performance.now(),
            }));
        }
      }
    }

    await emitWithSpan(versionSpanId, () =>
      events.emit({
        type: "version:end",
        version,
        durationMs: performance.now() - versionStartTime,
        spanId: versionSpanId,
        timestamp: performance.now(),
      }));
  }

  const durationMs = performance.now() - startTime;
  await emitWithSpan(pipelineSpanId, () =>
    events.emit({
      type: "pipeline:end",
      durationMs,
      spanId: pipelineSpanId,
      timestamp: performance.now(),
    }));

  const summary: PipelineSummary = {
    versions: versionsToRun,
    totalFiles,
    matchedFiles,
    skippedFiles,
    fallbackFiles,
    totalOutputs: outputs.length,
    durationMs,
  };

  const status: ExecutionStatus = errors.length === 0 ? "completed" : "failed";

  return {
    id: pipeline.id,
    data: outputs,
    graph: graph.build(),
    errors,
    summary,
    status,
  };
}

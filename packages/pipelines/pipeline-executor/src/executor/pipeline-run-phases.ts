import type {
  FileContext,
  PipelineError,
  PipelineEventInput,
  PipelineRouteDefinition,
  SourceFileContext,
} from "@ucdjs/pipelines-core";
import type {
  PipelineExecutionResult,
  PipelineSummary,
} from "../types";
import type { PipelineRunContext } from "./run-pipeline-types";
import { buildExecutionGraphFromTraces } from "../graph";
import { buildOutputManifestFromTraces } from "../traces";
import { emitWithSpan } from "./events";
import { materializeOutputs } from "./output-materialization";
import { createProcessingQueue } from "./processing-queue";
import {
  processFallback,
  processRoute,
  recordEmittedArtifacts,
} from "./route-execution";
import {
  buildCacheKey,
  storeCacheEntry,
  tryLoadCachedResult,
} from "./cache-helpers";

export async function runGlobalArtifacts(
  context: PipelineRunContext,
  version: string,
  artifactsMap: Record<string, unknown>,
  listVersionFiles: () => Promise<FileContext[]>,
): Promise<void> {
  for (const artifactDef of context.globalArtifacts) {
    const artifactStartTime = performance.now();
    const artifactSpanId = context.events.nextSpanId();

    await emitWithSpan(context.runtime, artifactSpanId, () =>
      context.events.emit({
        type: "artifact:start",
        artifactId: artifactDef.id,
        version,
        spanId: artifactSpanId,
        timestamp: performance.now(),
      }));

    await context.emitTraceWithSpan(artifactSpanId, {
      kind: "source.provided",
      version,
      artifactId: artifactDef.id,
    });

    try {
      let rows;

      if (artifactDef.filter && artifactDef.parser) {
        const files = await listVersionFiles();
        for (const file of files) {
          if (artifactDef.filter({ file, logger: context.logger })) {
            rows = artifactDef.parser({
              file,
              logger: context.logger,
              readContent: () => context.source.readFile(file),
              async *readLines() {
                const content = await context.source.readFile(file);
                yield* content.split(/\r?\n/);
              },
              isComment: (line) => line.startsWith("#") || line.trim() === "",
            });
            break;
          }
        }
      }

      artifactsMap[artifactDef.id] = await artifactDef.build({ version, logger: context.logger }, rows);
    } catch (error) {
      const pipelineError: PipelineError = {
        scope: "artifact",
        message: error instanceof Error ? error.message : String(error),
        error,
        artifactId: artifactDef.id,
        version,
      };
      context.errors.push(pipelineError);
      await emitWithSpan(context.runtime, artifactSpanId, () =>
        context.events.emit({
          type: "error",
          error: pipelineError,
          spanId: artifactSpanId,
          timestamp: performance.now(),
        }));
    }

    await emitWithSpan(context.runtime, artifactSpanId, () =>
      context.events.emit({
        type: "artifact:end",
        artifactId: artifactDef.id,
        version,
        durationMs: performance.now() - artifactStartTime,
        spanId: artifactSpanId,
        timestamp: performance.now(),
      }));
  }
}

interface RunMatchedRouteFileOptions {
  context: PipelineRunContext;
  version: string;
  route: PipelineRouteDefinition<any, any, any, any, any>;
  file: FileContext;
  artifactsMap: Record<string, unknown>;
  globalArtifactsMap: Record<string, unknown>;
}

export async function runMatchedRouteFile(options: RunMatchedRouteFileOptions): Promise<void> {
  const { context, version, route, file, artifactsMap, globalArtifactsMap } = options;
  const fileSpanId = context.events.nextSpanId();

  await context.emitTraceWithSpan(fileSpanId, {
    kind: "source.provided",
    version,
    file,
  });

  context.counters.matchedFiles++;
  await context.emitTraceWithSpan(fileSpanId, {
    kind: "file.matched",
    version,
    file,
    routeId: route.id,
  });
  await emitWithSpan(context.runtime, fileSpanId, () =>
    context.events.emit({
      type: "file:matched",
      file,
      routeId: route.id,
      spanId: fileSpanId,
      timestamp: performance.now(),
    }));

  await context.runtime.withSpan(fileSpanId, async () => {
    try {
      const routeCacheEnabled = context.useCache && route.cache !== false;
      const combinedArtifacts = { ...artifactsMap, ...globalArtifactsMap };
      let result = null as Awaited<ReturnType<typeof processRoute>> | null;
      let fileContent: string | undefined;

      if (routeCacheEnabled && context.cacheStore) {
        fileContent = await context.source.readFile(file);
        const cachedResult = await tryLoadCachedResult({
          cacheStore: context.cacheStore,
          routeId: route.id,
          version,
          fileContent,
          artifactsMap: combinedArtifacts,
        });

        if (cachedResult.hit && cachedResult.result) {
          result = cachedResult.result;
          context.counters.cached++;
          await context.emitTrace({
            kind: "cache.hit",
            routeId: route.id,
            file,
            version,
          });
          await context.events.emit({
            type: "cache:hit",
            routeId: route.id,
            file,
            version,
            spanId: fileSpanId,
            timestamp: performance.now(),
          });
        } else {
          await context.emitTrace({
            kind: "cache.miss",
            routeId: route.id,
            file,
            version,
          });
          await context.events.emit({
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
        result = await processRoute({
          file,
          route,
          artifactsMap: combinedArtifacts,
          runtime: context.runtime,
          source: context.source,
          version,
          emit: (event: PipelineEventInput) => context.events.emit({ ...event, spanId: fileSpanId }),
          spanId: context.events.nextSpanId,
        });

        if (routeCacheEnabled && context.cacheStore) {
          fileContent ??= await context.source.readFile(file);
          const cacheKey = await buildCacheKey(
            route.id,
            version,
            fileContent,
            combinedArtifacts,
            result.consumedArtifactIds,
          );

          await storeCacheEntry({
            cacheStore: context.cacheStore,
            cacheKey,
            outputs: result.outputs,
            emittedArtifacts: result.emittedArtifacts,
          });

          await context.emitTrace({
            kind: "cache.store",
            routeId: route.id,
            file,
            version,
          });
          await context.events.emit({
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

      for (const artifactId of result.consumedArtifactIds) {
        await context.emitTrace({
          kind: "artifact.consumed",
          routeId: route.id,
          artifactId,
          version,
        });
      }

      for (const artifactName of Object.keys(result.emittedArtifacts)) {
        await context.emitTrace({
          kind: "artifact.emitted",
          routeId: route.id,
          artifactId: `${route.id}:${artifactName}`,
          version,
        });
      }

      await materializeOutputs({
        context,
        version,
        routeId: route.id,
        file,
        values: result.outputs,
        spanId: fileSpanId,
      });
    } catch (error) {
      const pipelineError: PipelineError = {
        scope: "route",
        message: error instanceof Error ? error.message : String(error),
        error,
        file,
        routeId: route.id,
        version,
      };
      context.errors.push(pipelineError);
      await context.events.emit({
        type: "error",
        error: pipelineError,
        spanId: fileSpanId,
        timestamp: performance.now(),
      });
    }
  });
}

interface RunFallbackFileOptions {
  context: PipelineRunContext;
  version: string;
  file: FileContext;
  artifactsMap: Record<string, unknown>;
  globalArtifactsMap: Record<string, unknown>;
}

export async function runFallbackFile(options: RunFallbackFileOptions): Promise<void> {
  const { context, version, file, artifactsMap, globalArtifactsMap } = options;
  const fallbackSpanId = context.events.nextSpanId();

  await context.emitTraceWithSpan(fallbackSpanId, {
    kind: "source.provided",
    version,
    file,
  });
  await context.emitTraceWithSpan(fallbackSpanId, {
    kind: "file.fallback",
    version,
    file,
  });
  await emitWithSpan(context.runtime, fallbackSpanId, () =>
    context.events.emit({
      type: "file:fallback",
      file,
      spanId: fallbackSpanId,
      timestamp: performance.now(),
    }));

  try {
    const fallbackOutputs = await context.runtime.withSpan(fallbackSpanId, () => processFallback({
      file,
      fallback: context.pipeline.fallback!,
      artifactsMap: { ...artifactsMap, ...globalArtifactsMap },
      runtime: context.runtime,
      source: context.source,
      version,
      emit: (event: PipelineEventInput) => context.events.emit({ ...event, spanId: fallbackSpanId }),
      spanId: context.events.nextSpanId,
    }));

    await materializeOutputs({
      context,
      version,
      routeId: "__fallback__",
      file,
      values: fallbackOutputs,
      spanId: fallbackSpanId,
      routeOutputs: [{
        id: "fallback-output",
        format: "json",
      }],
    });
  } catch (error) {
    const pipelineError: PipelineError = {
      scope: "file",
      message: error instanceof Error ? error.message : String(error),
      error,
      file,
      version,
    };
    context.errors.push(pipelineError);
    await emitWithSpan(context.runtime, fallbackSpanId, () =>
      context.events.emit({
        type: "error",
        error: pipelineError,
        spanId: fallbackSpanId,
        timestamp: performance.now(),
      }));
  }
}

export async function runVersion(
  context: PipelineRunContext,
  version: string,
): Promise<void> {
  const versionStartTime = performance.now();
  const versionSpanId = context.events.nextSpanId();

  await emitWithSpan(context.runtime, versionSpanId, () =>
    context.events.emit({
      type: "version:start",
      version,
      spanId: versionSpanId,
      timestamp: performance.now(),
    }));

  const artifactsMap: Record<string, unknown> = {};
  const globalArtifactsMap: Record<string, unknown> = {};

  let versionFiles: FileContext[] | null = null;
  const listVersionFiles = async (): Promise<FileContext[]> => {
    if (!versionFiles) {
      versionFiles = await context.source.listFiles(version);
    }
    return versionFiles;
  };

  await runGlobalArtifacts(context, version, artifactsMap, listVersionFiles);

  const files = await listVersionFiles();
  context.counters.totalFiles += files.length;

  const filesToProcess = context.pipeline.include
    ? files.filter((file) => context.pipeline.include!({ file, logger: context.logger }))
    : files;

  const processedFiles = new Set<string>();

  for (const layerRoutes of context.routesByLayer) {
    const processingQueue = createProcessingQueue(context.pipeline.concurrency);

    for (const route of layerRoutes) {
      const matchingFiles = filesToProcess.filter((file) => {
        const sourceFile = file as SourceFileContext;
        return route.filter({
          file,
          logger: context.logger,
          source: sourceFile.source,
        });
      });

      for (const file of matchingFiles) {
        processedFiles.add(file.path);
        context.counters.totalRoutes++;
        await processingQueue.add(() => runMatchedRouteFile({
          context,
          version,
          route,
          file,
          artifactsMap,
          globalArtifactsMap,
        }));
      }
    }

    await processingQueue.drain();
  }

  for (const file of filesToProcess) {
    if (processedFiles.has(file.path)) {
      continue;
    }

    if (context.pipeline.fallback) {
      const shouldUseFallback = !context.pipeline.fallback.filter
        || context.pipeline.fallback.filter({ file, logger: context.logger });

      if (shouldUseFallback) {
        context.counters.fallbackFiles++;
        await runFallbackFile({
          context,
          version,
          file,
          artifactsMap,
          globalArtifactsMap,
        });
      } else {
        context.counters.skippedFiles++;
        await emitWithSpan(context.runtime, versionSpanId, () =>
          context.events.emit({
            type: "file:skipped",
            file,
            reason: "filtered",
            spanId: versionSpanId,
            timestamp: performance.now(),
          }));
      }
    } else {
      context.counters.skippedFiles++;

      if (context.pipeline.strict) {
        const pipelineError: PipelineError = {
          scope: "file",
          message: `No matching route for file: ${file.path}`,
          file,
          version,
        };
        context.errors.push(pipelineError);
        await emitWithSpan(context.runtime, versionSpanId, () =>
          context.events.emit({
            type: "error",
            error: pipelineError,
            spanId: versionSpanId,
            timestamp: performance.now(),
          }));
      } else {
        await emitWithSpan(context.runtime, versionSpanId, () =>
          context.events.emit({
            type: "file:skipped",
            file,
            reason: "no-match",
            spanId: versionSpanId,
            timestamp: performance.now(),
          }));
      }
    }
  }

  await emitWithSpan(context.runtime, versionSpanId, () =>
    context.events.emit({
      type: "version:end",
      version,
      durationMs: performance.now() - versionStartTime,
      spanId: versionSpanId,
      timestamp: performance.now(),
    }));
}

export async function finalizePipelineResult(
  context: PipelineRunContext,
  startTime: number,
): Promise<PipelineExecutionResult> {
  const durationMs = performance.now() - startTime;
  const summary: PipelineSummary = {
    versions: context.versionsToRun,
    totalRoutes: context.counters.totalRoutes,
    cached: context.counters.cached,
    totalFiles: context.counters.totalFiles,
    matchedFiles: context.counters.matchedFiles,
    skippedFiles: context.counters.skippedFiles,
    fallbackFiles: context.counters.fallbackFiles,
    totalOutputs: context.outputs.length,
    durationMs,
  };

  const status = context.errors.length === 0 ? "completed" : "failed";

  return {
    id: context.pipeline.id,
    data: context.outputs,
    outputManifest: buildOutputManifestFromTraces(context.traceRecords),
    traces: context.traceRecords,
    graph: buildExecutionGraphFromTraces(context.traceRecords),
    errors: context.errors,
    summary,
    status,
  };
}

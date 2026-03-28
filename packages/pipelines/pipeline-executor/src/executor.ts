import type { AnyPipelineDefinition } from "@ucdjs/pipelines-core";
import type {
  PipelineExecutionResult,
  PipelineExecutor,
  PipelineExecutorOptions,
  PipelineExecutorRunOptions,
} from "./types";
import { createTraceEmitter } from "./internal/trace-emitter";
import { run as runPipeline } from "./run";
import { createNoopExecutionRuntime } from "./runtime";

export function createPipelineExecutor(options: PipelineExecutorOptions): PipelineExecutor {
  const {
    cacheStore,
    onLog,
    onTrace,
    runtime = createNoopExecutionRuntime(),
  } = options;

  const traces = createTraceEmitter({ onTrace, runtime });

  const run = async (pipelinesToRun: AnyPipelineDefinition[], runOptions: PipelineExecutorRunOptions = {}): Promise<PipelineExecutionResult[]> => {
    return runtime.runWithLogHandler(onLog, async () => {
      const stopCapture = runtime.startOutputCapture?.() ?? (() => {});
      const results: PipelineExecutionResult[] = [];

      try {
        const orderedPipelines = orderPipelinesByPublishedOutputDependencies(pipelinesToRun);

        for (const pipeline of orderedPipelines) {
          try {
            results.push(await runPipeline({
              pipeline,
              runOptions,
              cacheStore,
              traces,
              priorResults: results,
              runtime,
            }));
          } catch (err) {
            results.push({
              id: pipeline.id,
              data: [],
              outputManifest: [],
              traces: [],
              graph: { nodes: [], edges: [] },
              errors: [{
                scope: "pipeline",
                message: err instanceof Error ? err.message : String(err),
                error: err,
              }],
              summary: {
                versions: pipeline.versions,
                totalRoutes: 0,
                cached: 0,
                totalFiles: 0,
                matchedFiles: 0,
                skippedFiles: 0,
                fallbackFiles: 0,
                totalOutputs: 0,
                durationMs: 0,
              },
              status: "failed",
            });
          }
        }

        return results;
      } finally {
        stopCapture();
      }
    });
  };

  return { run };
}

function orderPipelinesByPublishedOutputDependencies(
  pipelines: AnyPipelineDefinition[],
): AnyPipelineDefinition[] {
  const byId = new Map(pipelines.map((pipeline) => [pipeline.id, pipeline]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const ordered: AnyPipelineDefinition[] = [];

  // eslint-disable-next-line ts/explicit-function-return-type
  function visit(pipeline: AnyPipelineDefinition) {
    if (visited.has(pipeline.id)) {
      return;
    }

    if (visiting.has(pipeline.id)) {
      throw new Error(`Circular pipeline output dependency detected at "${pipeline.id}"`);
    }

    visiting.add(pipeline.id);
    for (const input of pipeline.inputs) {
      if (input.kind !== "pipeline-output") {
        continue;
      }

      const dependency = byId.get(input.pipelineId);
      if (!dependency) {
        throw new Error(`Pipeline "${pipeline.id}" depends on missing pipeline "${input.pipelineId}"`);
      }
      visit(dependency);
    }
    visiting.delete(pipeline.id);
    visited.add(pipeline.id);
    ordered.push(pipeline);
  }

  for (const pipeline of pipelines) {
    visit(pipeline);
  }

  return ordered;
}

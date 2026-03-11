import type { AnyPipelineDefinition } from "@ucdjs/pipelines-core";
import type {
  PipelineExecutionResult,
  PipelineExecutor,
  PipelineExecutorOptions,
  PipelineExecutorRunOptions,
} from "./types";
import { createEventEmitter } from "./executor/events";
import { runPipeline } from "./executor/run-pipeline";
import { createNoopExecutionRuntime } from "./runtime";

export function createPipelineExecutor(options: PipelineExecutorOptions): PipelineExecutor {
  const {
    artifacts: globalArtifacts = [],
    cacheStore,
    onEvent,
    onLog,
    runtime = createNoopExecutionRuntime(),
  } = options;

  const events = createEventEmitter({ onEvent, runtime });

  const run = async (pipelinesToRun: AnyPipelineDefinition[], runOptions: PipelineExecutorRunOptions = {}): Promise<PipelineExecutionResult[]> => {
    return runtime.runWithLogHandler(onLog, async () => {
      const stopCapture = runtime.startOutputCapture?.() ?? (() => {});
      const results: PipelineExecutionResult[] = [];

      try {
        for (const pipeline of pipelinesToRun) {
          try {
            results.push(await runPipeline({
              pipeline,
              runOptions,
              cacheStore,
              artifacts: globalArtifacts,
              events,
              runtime,
            }));
          } catch (err) {
            results.push({
              id: pipeline.id,
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

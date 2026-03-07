import type { AnyPipelineDefinition } from "@ucdjs/pipelines-core";
import type {
  PipelineExecutionResult,
  PipelineExecutor,
  PipelineExecutorOptions,
  PipelineExecutorRunOptions,
} from "./types";
import { createEventEmitter } from "./executor/events";
import { runWithPipelineLogHandler, startLogCapture } from "./logger";
import { runPipeline } from "./executor/run-pipeline";

export function createPipelineExecutor(options: PipelineExecutorOptions): PipelineExecutor {
  const {
    artifacts: globalArtifacts = [],
    cacheStore,
    capture,
    onEvent,
    onLog,
  } = options;

  const events = createEventEmitter({ onEvent });

  const run = async (pipelinesToRun: AnyPipelineDefinition[], runOptions: PipelineExecutorRunOptions = {}): Promise<PipelineExecutionResult[]> => {
    return runWithPipelineLogHandler(onLog, async () => {
      const stopCapture = startLogCapture(capture);
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

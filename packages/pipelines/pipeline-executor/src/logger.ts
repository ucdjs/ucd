import type { PipelineLogger } from "@ucdjs/pipelines-core";
import type { PipelineExecutionRuntime } from "./runtime";

export function createPipelineLogger(runtime: PipelineExecutionRuntime): PipelineLogger {
  return {
    debug: (message, meta) => {
      runtime.emitLog({ level: "debug", stream: "stdout", source: "logger", message, args: [message], meta });
    },
    info: (message, meta) => {
      runtime.emitLog({ level: "info", stream: "stdout", source: "logger", message, args: [message], meta });
    },
    warn: (message, meta) => {
      runtime.emitLog({ level: "warn", stream: "stderr", source: "logger", message, args: [message], meta });
    },
    error: (message, meta) => {
      runtime.emitLog({ level: "error", stream: "stderr", source: "logger", message, args: [message], meta });
    },
  };
}

import type { PipelineLogger } from "@ucdjs/pipelines-core";

function noop(): void {}

export function createPipelineLogger(): PipelineLogger {
  return {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
  };
}

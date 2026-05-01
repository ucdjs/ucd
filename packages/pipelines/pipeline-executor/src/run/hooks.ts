import type { PipelineLogger } from "@ucdjs/pipeline-core";

interface RunPipelineHookOptions {
  logger: PipelineLogger;
}

export async function runPipelineHook(
  name: string,
  fn: (() => void | Promise<void>) | undefined,
  options: RunPipelineHookOptions,
): Promise<void> {
  if (!fn) {
    return;
  }

  try {
    await fn();
  } catch (error) {
    options.logger.error("Pipeline hook failed", {
      hook: name,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

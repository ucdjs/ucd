import { createPipelineExecutor } from "@ucdjs/pipelines-executor";
import { findPipelineFiles, loadPipelinesFromPaths } from "@ucdjs/pipelines-loader";
import { H3, readBody } from "h3";

export const executeRouter = new H3();

interface ExecuteBody {
  versions?: string[];
  cache?: boolean;
}

executeRouter.post("/", async (event) => {
  const { cwd } = event.context;
  const id = event.context.params?.id;

  if (!id) {
    return { error: "Pipeline ID is required" };
  }

  const files = await findPipelineFiles(cwd);
  const result = await loadPipelinesFromPaths(files);

  const pipeline = result.pipelines.find((p) => p.id === id);

  if (!pipeline) {
    return { error: `Pipeline "${id}" not found` };
  }

  const body = (await readBody<ExecuteBody>(event).catch(() => null)) ?? {};
  const versions = body.versions ?? pipeline.versions;
  const cache = body.cache ?? true;

  const executor = createPipelineExecutor({});

  try {
    const execResult = await executor.run([pipeline], {
      versions,
      cache,
    });

    const pipelineResult = execResult.results.get(id);

    return {
      success: true,
      pipelineId: id,
      summary: pipelineResult?.summary,
      errors: pipelineResult?.errors.map((e) => ({
        scope: e.scope,
        message: e.message,
      })),
    };
  } catch (err) {
    return {
      success: false,
      pipelineId: id,
      error: err instanceof Error ? err.message : String(err),
    };
  }
});

import {
  findPipelineFiles,
  findRemotePipelineFiles,
  loadPipelinesFromPaths,
  loadRemotePipelines,
} from "@ucdjs/pipelines-loader";
import { H3 } from "h3";

export const sourcesRouter = new H3();

sourcesRouter.get("/", async (event) => {
  const { sources } = event.context;

  const formattedSources = sources.map((source) => {
    const base = {
      id: source.id,
      type: source.type,
    };

    switch (source.type) {
      case "local":
        return { ...base, cwd: source.cwd };
      case "github":
      case "gitlab":
        return {
          ...base,
          owner: source.owner,
          repo: source.repo,
          ref: source.ref,
          path: source.path,
        };
      default:
        throw new Error(`Unknown source type: ${(source as any).type}`);
    }
  });

  return { sources: formattedSources };
});

sourcesRouter.get("/:sourceId/pipelines", async (event) => {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;

  if (!sourceId) {
    return { error: "Source ID is required" };
  }

  const source = sources.find((s) => s.id === sourceId);
  if (!source) {
    return { error: `Source "${sourceId}" not found` };
  }

  try {
    if (source.type === "local") {
      const files = await findPipelineFiles({ cwd: source.cwd });
      const result = await loadPipelinesFromPaths(files);

      return {
        pipelines: result.pipelines.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          versions: p.versions,
          inputs: p.inputs.map((i) => i.id),
          routes: p.routes.map((r) => r.id),
        })),
        errors: result.errors.map((e) => ({
          filePath: e.filePath,
          message: e.error.message,
        })),
      };
    } else {
      const fileList = await findRemotePipelineFiles(source);
      const result = await loadRemotePipelines(source, fileList.files);

      return {
        pipelines: result.pipelines.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          versions: p.versions,
          inputs: p.inputs.map((i) => i.id),
          routes: p.routes.map((r) => r.id),
        })),
        errors: result.errors.map((e) => ({
          filePath: e.filePath,
          message: e.error.message,
        })),
      };
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
});

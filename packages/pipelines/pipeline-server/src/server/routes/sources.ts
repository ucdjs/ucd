import { findPipelineFiles, findRemotePipelineFiles, loadPipelinesFromPaths, loadRemotePipelines } from "@ucdjs/pipelines-loader";
import type { GitHubSource, GitLabSource, LocalSource } from "@ucdjs/pipelines-loader";
import { H3 } from "h3";

export const sourcesRouter = new H3();

sourcesRouter.get("/", async (event) => {
  const { sources } = event.context;

  return {
    sources: sources.map((source) => ({
      id: source.id,
      type: source.type,
      ...(source.type === "local" ? { cwd: (source as LocalSource).cwd } : {}),
      ...(source.type === "github" ? {
        owner: (source as GitHubSource).owner,
        repo: (source as GitHubSource).repo,
        ref: (source as GitHubSource).ref,
        path: (source as GitHubSource).path,
      } : {}),
      ...(source.type === "gitlab" ? {
        owner: (source as GitLabSource).owner,
        repo: (source as GitLabSource).repo,
        ref: (source as GitLabSource).ref,
        path: (source as GitLabSource).path,
      } : {}),
    })),
  };
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
      const localSource = source as LocalSource;
      const files = await findPipelineFiles({ cwd: localSource.cwd });
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
      const remoteSource = source as GitHubSource | GitLabSource;
      const fileList = await findRemotePipelineFiles(remoteSource);
      const result = await loadRemotePipelines(remoteSource, fileList.files);

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

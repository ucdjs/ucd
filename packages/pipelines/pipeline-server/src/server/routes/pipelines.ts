import type { GitHubSource, GitLabSource, LocalSource } from "@ucdjs/pipelines-loader";
import fs from "node:fs";
import path from "node:path";
import {
  findPipelineFiles,
  findRemotePipelineFiles,
  github,
  gitlab,
  loadPipelinesFromPaths,
  loadRemotePipelines,
} from "@ucdjs/pipelines-loader";
import { getQuery, H3 } from "h3";
import { extractDefinePipelineCode } from "../code";
import { toPipelineDetails, toPipelineInfo } from "../types";

export const pipelinesRouter = new H3();

pipelinesRouter.get("/", async (event) => {
  const { sources } = event.context;
  const query = getQuery(event).query;
  const search = typeof query === "string" ? query.trim().toLowerCase() : "";

  const allPipelines: ReturnType<typeof toPipelineInfo>[] = [];
  const allErrors: Array<{ filePath: string; message: string; sourceId: string }> = [];

  for (const source of sources) {
    try {
      let result;
      if (source.type === "local") {
        const localSource = source as LocalSource;
        const files = await findPipelineFiles({ cwd: localSource.cwd });
        result = await loadPipelinesFromPaths(files);
      } else {
        const remoteSource = source as GitHubSource | GitLabSource;
        const fileList = await findRemotePipelineFiles(remoteSource);
        result = await loadRemotePipelines(remoteSource, fileList.files);
      }

      const pipelines = search
        ? result.pipelines.filter((pipeline) => {
            const haystack = [
              pipeline.id,
              pipeline.name ?? "",
              pipeline.description ?? "",
              ...pipeline.versions,
              ...pipeline.routes.map((route) => route.id),
              ...pipeline.inputs.map((input) => input.id),
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(search);
          })
        : result.pipelines;

      allPipelines.push(...pipelines.map((p) => ({ ...toPipelineInfo(p), sourceId: source.id })));
      allErrors.push(...result.errors.map((e) => ({ filePath: e.filePath, message: e.error.message, sourceId: source.id })));
    } catch (err) {
      allErrors.push({
        filePath: "",
        message: err instanceof Error ? err.message : String(err),
        sourceId: source.id,
      });
    }
  }

  return {
    pipelines: allPipelines,
    errors: allErrors,
  };
});

pipelinesRouter.get("/:id", async (event) => {
  const { sources } = event.context;
  const id = event.context.params?.id;

  if (!id) {
    return { error: "Pipeline ID is required" };
  }

  for (const source of sources) {
    try {
      let result;
      if (source.type === "local") {
        const localSource = source as LocalSource;
        const files = await findPipelineFiles({ cwd: localSource.cwd });
        result = await loadPipelinesFromPaths(files);
      } else {
        const remoteSource = source as GitHubSource | GitLabSource;
        const fileList = await findRemotePipelineFiles(remoteSource);
        result = await loadRemotePipelines(remoteSource, fileList.files);
      }

      const pipeline = result.pipelines.find((p) => p.id === id);

      if (pipeline) {
        return {
          pipeline: toPipelineDetails(pipeline),
          sourceId: source.id,
        };
      }
    } catch {
      // Continue to next source
    }
  }

  return { error: `Pipeline "${id}" not found` };
});

pipelinesRouter.get("/:id/code", async (event) => {
  const { sources } = event.context;
  const id = event.context.params?.id;

  if (!id) {
    return { error: "Pipeline ID is required" };
  }

  for (const source of sources) {
    try {
      let result;
      let content: string | undefined;

      if (source.type === "local") {
        const localSource = source as LocalSource;
        const files = await findPipelineFiles({ cwd: localSource.cwd });
        result = await loadPipelinesFromPaths(files);

        const file = result.files.find((f) => f.pipelines.some((p) => p.id === id));
        if (file) {
          const filePath = path.resolve(localSource.cwd, file.filePath);
          content = await fs.promises.readFile(filePath, "utf-8");
        }
      } else {
        const remoteSource = source as GitHubSource | GitLabSource;
        const fileList = await findRemotePipelineFiles(remoteSource);
        result = await loadRemotePipelines(remoteSource, fileList.files);

        const file = result.files.find((f) => f.pipelines.some((p) => p.id === id));
        if (file) {
          const { owner, repo, ref } = remoteSource;
          content = remoteSource.type === "github"
            ? await github.fetchFile({ owner, repo, ref }, file.filePath)
            : await gitlab.fetchFile({ owner, repo, ref }, file.filePath);
        }
      }

      const file = result.files.find((f) => f.pipelines.some((p) => p.id === id));

      if (!file || !content) {
        continue;
      }

      const exportIndex = file.pipelines.findIndex((p) => p.id === id);
      const exportName = file.exportNames[exportIndex] ?? "default";

      return {
        code: extractDefinePipelineCode(content, { exportName }),
        filePath: file.filePath,
        sourceId: source.id,
      };
    } catch {
      // Continue to next source
    }
  }

  return { error: `Pipeline "${id}" not found` };
});

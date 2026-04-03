import type { PipelineSource } from "#server/app";
import type { LoadedPipelineFile, PipelineLoaderIssue } from "@ucdjs/pipeline-loader";
import {
  loadPipelinesFromPaths,
  materializePipelineLocator,
} from "@ucdjs/pipeline-loader";
import { discoverPipelineFiles } from "@ucdjs/pipeline-loader/discover";
import { fileIdFromPath, fileLabelFromPath } from "./ids";

type ResolvedSourceFile = LoadedPipelineFile & {
  id: string;
  label: string;
  relativePath: string;
};

function resolveDiscoveredFile(filePath: string, relativePath: string) {
  return {
    id: fileIdFromPath(relativePath),
    label: fileLabelFromPath(relativePath),
    relativePath,
    filePath,
  };
}

async function discoverSourceFiles(source: PipelineSource): Promise<{
  files: Array<ReturnType<typeof resolveDiscoveredFile>>;
  issues: PipelineLoaderIssue[];
}> {
  const { id: _id, ...locator } = source;
  const materialized = await materializePipelineLocator(locator);

  if (materialized.issues.length > 0) {
    return {
      files: [],
      issues: materialized.issues,
    };
  }

  if (materialized.filePath && materialized.relativePath) {
    return {
      files: [resolveDiscoveredFile(materialized.filePath, materialized.relativePath)],
      issues: [],
    };
  }

  if (!materialized.repositoryPath) {
    return {
      files: [],
      issues: [{
        code: "MATERIALIZE_FAILED",
        scope: "repository",
        message: `Source "${source.id}" could not be materialized.`,
        locator,
      }],
    };
  }

  const discovery = await discoverPipelineFiles({
    repositoryPath: materialized.repositoryPath,
    ...(materialized.origin ? { origin: materialized.origin } : {}),
  });

  return {
    files: discovery.files.map((file) => resolveDiscoveredFile(file.filePath, file.relativePath)),
    issues: discovery.issues,
  };
}

export function sourceLabel(source: PipelineSource): string {
  if (source.kind === "local") return "local";
  return `${source.owner}/${source.repo}`;
}

export async function resolveSourceFiles(source: PipelineSource): Promise<{
  files: ResolvedSourceFile[];
  issues: PipelineLoaderIssue[];
}> {
  const discovery = await discoverSourceFiles(source);
  const filePaths = discovery.files.map((file) => file.filePath);

  if (filePaths.length === 0) {
    return { files: [], issues: discovery.issues };
  }

  const result = await loadPipelinesFromPaths(filePaths);
  const files = result.files.map((file) => {
    const discovered = discovery.files.find((entry) => entry.filePath === file.filePath);

    return {
      ...file,
      id: discovered?.id ?? fileIdFromPath(file.filePath),
      label: discovered?.label ?? fileLabelFromPath(file.filePath),
      relativePath: discovered?.relativePath ?? file.filePath,
    };
  });

  return {
    files,
    issues: [...discovery.issues, ...result.issues],
  };
}

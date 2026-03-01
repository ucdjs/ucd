import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import type { PipelineSource } from "@ucdjs/pipelines-loader";
import type { PipelineInfo } from "@ucdjs/pipelines-ui";
import type { LoadedPipelineFile } from "packages/pipelines/pipeline-loader/src/types";
import { toPipelineInfo } from "@ucdjs/pipelines-ui";
import { fileIdFromPath, fileLabelFromPath } from "./ids";
import { getPipelines } from "./loader";

export interface FilePipelineEntry {
  pipeline: PipelineDefinition;
  exportName: string;
}

export interface PipelineFileGroup {
  fileId: string;
  filePath: string;
  sourceFilePath?: string;
  fileLabel: string;
  sourceId: string;
  pipelines: PipelineInfo[];
  entries: FilePipelineEntry[];
}

export interface PipelineLoadErrorInfo {
  filePath: string;
  message: string;
  sourceId: string;
}

export interface PipelineSourceGroup {
  sourceId: string;
  source: PipelineSource;
  fileGroups: PipelineFileGroup[];
  errors: PipelineLoadErrorInfo[];
}

export function buildFileGroups(
  sourceId: string,
  files: LoadedPipelineFile[],
): PipelineFileGroup[] {
  return files.map((file) => {
    const entries = file.pipelines.map((pipeline, index) => ({
      pipeline,
      exportName: file.exportNames[index] ?? "default",
    }));

    const fileId = fileIdFromPath(file.filePath);
    const fileLabel = fileLabelFromPath(file.filePath);

    return {
      fileId,
      filePath: file.filePath,
      sourceFilePath: file.sourceFilePath,
      fileLabel,
      sourceId,
      pipelines: entries.map((entry) => ({
        ...toPipelineInfo(entry.pipeline),
        sourceId,
      })),
      entries,
    };
  });
}

export function applySearchFilter(
  groups: PipelineFileGroup[],
  search: string,
): PipelineFileGroup[] {
  if (!search) return groups;

  return groups
    .map((group) => {
      const entries = group.entries.filter(({ pipeline }) => {
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
      });

      if (!entries.length) {
        return null;
      }

      return {
        ...group,
        pipelines: entries.map((entry) => ({
          ...toPipelineInfo(entry.pipeline),
          sourceId: group.sourceId,
        })),
        entries,
      };
    })
    .filter((group): group is PipelineFileGroup => Boolean(group));
}

export function findFileGroup(
  fileId: string,
  fileGroups: PipelineFileGroup[],
): PipelineFileGroup | null {
  return fileGroups.find((group) => group.fileId === fileId) ?? null;
}

export function findPipelineByFileId(
  fileId: string,
  fileGroups: PipelineFileGroup[],
  pipelineId: string,
): {
  fileGroup: PipelineFileGroup;
  entry: FilePipelineEntry;
} | null {
  const fileGroup = findFileGroup(fileId, fileGroups);

  if (!fileGroup) return null;

  const entry = fileGroup.entries.find(({ pipeline }) => pipeline.id === pipelineId);
  if (!entry) return null;

  return { fileGroup, entry };
}

export async function loadPipelineFileGroups(
  sources: PipelineSource[],
): Promise<PipelineSourceGroup[]> {
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const { result, cacheError } = await getPipelines(source);
      const fileGroups = buildFileGroups(source.id, result.files);
      const errors = result.errors.map((e) => ({
        filePath: e.filePath,
        message: e.error.message,
        sourceId: source.id,
      }));

      // Add cache error if present
      if (cacheError) {
        errors.push({
          filePath: "",
          message: cacheError.message,
          sourceId: source.id,
        });
      }

      return {
        sourceId: source.id,
        source,
        fileGroups,
        errors,
      };
    }),
  );

  return results.map((result, index) => {
    const source = sources[index]!;

    if (result.status === "fulfilled") {
      return result.value;
    }

    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    return {
      sourceId: source.id,
      source,
      fileGroups: [],
      errors: [{ filePath: "", message, sourceId: source.id }],
    };
  });
}

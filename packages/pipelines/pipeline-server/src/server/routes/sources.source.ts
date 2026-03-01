import type { PipelineFileGroup, PipelineLoadErrorInfo } from "#server/lib/files";
import type { SourceDetail, SourceFileResponse, SourceList } from "@ucdjs/pipelines-ui/schemas";
import {
  findFileGroup,
  loadPipelineFileGroups,
} from "#server/lib/files";
import { H3 } from "h3";

export const sourcesSourceRouter: H3 = new H3();

sourcesSourceRouter.get("/", async (event) => {
  const { sources } = event.context;

  return sources.map((s) => ({
    id: s.id,
    type: s.type,
  })) satisfies SourceList;
});

sourcesSourceRouter.get("/:sourceId/:fileId", async (event) => {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;
  const fileId = event.context.params?.fileId;

  if (!sourceId || !fileId) {
    return { error: "Source ID and File ID are required" };
  }

  const allErrors: PipelineLoadErrorInfo[] = [];
  const groups = await loadPipelineFileGroups(sources);

  for (const group of groups) {
    const fileGroup = findFileGroup(fileId, group.fileGroups);
    if (fileGroup && fileGroup.sourceId === sourceId) {
      return {
        sourceId,
        fileId,
        file: {
          fileId: fileGroup.fileId,
          filePath: fileGroup.filePath,
          sourceFilePath: fileGroup.sourceFilePath,
          fileLabel: fileGroup.fileLabel,
          sourceId: fileGroup.sourceId,
          pipelines: fileGroup.pipelines,
        },
        errors: group.errors.filter((e) => e.filePath === fileGroup.filePath),
      } satisfies SourceFileResponse;
    }

    allErrors.push(...group.errors);
  }

  return { error: `Pipeline file "${fileId}" not found in source "${sourceId}"`, errors: allErrors };
});

sourcesSourceRouter.get("/:sourceId", async (event) => {
  const { sources } = event.context;
  const sourceId = event.context.params!.sourceId!;

  const source = sources.find((s) => s.id === sourceId);
  if (!source) {
    console.log("Source not found:", sourceId);
    throw new Error("Source not found");
  }

  const groups = await loadPipelineFileGroups([source]);
  const allFiles: PipelineFileGroup[] = [];
  const allErrors: PipelineLoadErrorInfo[] = [];

  for (const group of groups) {
    allFiles.push(...group.fileGroups);
    allErrors.push(...group.errors);
  }

  return {
    sourceId,
    files: allFiles.map((file) => ({
      fileId: file.fileId,
      filePath: file.filePath,
      sourceFilePath: file.sourceFilePath,
      fileLabel: file.fileLabel,
      sourceId: file.sourceId,
      pipelines: file.pipelines,
    })),
    errors: allErrors,
  } satisfies SourceDetail;
});

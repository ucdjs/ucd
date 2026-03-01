import type { PipelineLoadErrorInfo } from "#server/lib/files";
import {
  findFileGroup,
  loadPipelineFileGroups,
} from "#server/lib/files";
import type { SourceFileResponse } from "@ucdjs/pipelines-ui/schemas";
import { H3 } from "h3";

export const sourcesSourceRouter: H3 = new H3();

// GET /api/sources/:sourceId/:fileId - File details
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

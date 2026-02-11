import type { PipelineLoadErrorInfo } from "#server/lib/files";
import {
  findFileGroup,
  loadPipelineFileGroups,
} from "#server/lib/files";
import { H3 } from "h3";

export const pipelinesFileRouter = new H3();

pipelinesFileRouter.get("/:file", async (event) => {
  const { sources } = event.context;
  const fileId = event.context.params?.file;

  if (!fileId) {
    return { error: "File ID is required" };
  }

  const allErrors: PipelineLoadErrorInfo[] = [];
  const groups = await loadPipelineFileGroups(sources);

  for (const group of groups) {
    const fileGroup = findFileGroup(fileId, group.fileGroups);
    if (fileGroup) {
      return {
        file: {
          fileId: fileGroup.fileId,
          filePath: fileGroup.filePath,
          fileLabel: fileGroup.fileLabel,
          sourceId: fileGroup.sourceId,
          pipelines: fileGroup.pipelines,
        },
      };
    }

    allErrors.push(...group.errors);
  }

  return { error: `Pipeline file "${fileId}" not found`, errors: allErrors };
});

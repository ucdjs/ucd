import { findPipelineByFileId, loadPipelineFileGroups } from "#server/lib/files";
import { toPipelineDetails } from "@ucdjs/pipelines-ui";
import { H3 } from "h3";

export const sourcesFileRouter: H3 = new H3();

// GET /api/sources/:sourceId/:fileId/:pipelineId - Pipeline details
sourcesFileRouter.get("/:sourceId/:fileId/:pipelineId", async (event) => {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;
  const fileId = event.context.params?.fileId;
  const pipelineId = event.context.params?.pipelineId;

  if (!sourceId || !fileId || !pipelineId) {
    return { error: "Source ID, File ID, and Pipeline ID are required" };
  }

  const groups = await loadPipelineFileGroups(sources);
  
  for (const group of groups) {
    const match = findPipelineByFileId(fileId, group.fileGroups, pipelineId);
    if (match && match.fileGroup.sourceId === sourceId) {
      return {
        sourceId,
        fileId,
        pipelineId,
        pipeline: toPipelineDetails(match.entry.pipeline),
        filePath: match.fileGroup.filePath,
        fileLabel: match.fileGroup.fileLabel,
      };
    }
  }

  return { error: `Pipeline "${pipelineId}" not found in file "${fileId}" of source "${sourceId}"` };
});

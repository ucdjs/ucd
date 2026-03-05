import { toPipelineDetails } from "@ucdjs/pipelines-ui";
import { H3, HTTPError } from "h3";
import { findPipelineByFileId } from "../lib/files";

export const sourcesFileRouter: H3 = new H3();

sourcesFileRouter.get("/:sourceId/:fileId/:pipelineId", async (event) => {
  const sourceId = event.context.params?.sourceId;
  const fileId = event.context.params?.fileId;
  const pipelineId = event.context.params?.pipelineId;

  if (!sourceId || !fileId || !pipelineId) {
    return { error: "Source ID, File ID, and Pipeline ID are required" };
  }

  const data = await event.context.getSourceData(sourceId);
  if (!data) {
    throw HTTPError.status(404, "Not Found", { message: `Source "${sourceId}" not found` });
  }

  const match = findPipelineByFileId(fileId, data.fileGroups, pipelineId);
  if (match) {
    return {
      sourceId,
      fileId,
      pipelineId,
      pipeline: toPipelineDetails(match.entry.pipeline),
      filePath: match.fileGroup.filePath,
      fileLabel: match.fileGroup.fileLabel,
    };
  }

  throw HTTPError.status(404, "Not Found", { message: `Pipeline "${pipelineId}" not found in file "${fileId}" of source "${sourceId}"` });
});

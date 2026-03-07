import { toPipelineInfo } from "@ucdjs/pipelines-ui";
import { H3, HTTPError } from "h3";

export const sourcesFileRouter: H3 = new H3();

sourcesFileRouter.use("/:sourceId/files/:fileId/**", async (event, next) => {
  const { resolvedSource } = event.context;
  const fileId = event.context.params?.fileId;

  if (resolvedSource == null) {
    throw HTTPError.status(404, "Source not found");
  }

  if (!fileId) {
    throw HTTPError.status(400, "File ID is required");
  }

  const file = resolvedSource.files.find((entry) => entry.id === fileId);
  if (!file) {
    throw HTTPError.status(404, `File "${fileId}" not found in source "${resolvedSource.id}"`);
  }

  event.context.resolvedFile = {
    file,
    fileId,
  };

  return next();
});

sourcesFileRouter.get("/:sourceId/files/:fileId", async (event) => {
  const { resolvedSource, resolvedFile } = event.context;

  if (resolvedSource == null) {
    throw HTTPError.status(404, "Source not found");
  }

  if (resolvedFile == null) {
    throw HTTPError.status(404, "File not found");
  }

  const { file } = resolvedFile;

  return {
    id: file.id,
    path: file.relativePath,
    label: file.label,
    sourceId: resolvedSource.id,
    pipelines: file.pipelines.map(({ pipeline }) => toPipelineInfo(pipeline)),
  };
});

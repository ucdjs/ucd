import { resolveSourceFiles } from "#server/lib/resolve";
import { toPipelineInfo, type SourceFileResponse } from "@ucdjs/pipelines-ui";
import { H3, HTTPError } from "h3";

export const sourcesFileRouter: H3 = new H3();

sourcesFileRouter.get("/:sourceId/files/:fileId", async (event) => {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;
  const fileId = event.context.params?.fileId;

  if (!sourceId) {
    throw HTTPError.status(400, "Source ID is required");
  }

  if (!fileId) {
    throw HTTPError.status(400, "File ID is required");
  }

  const source = sources.find((source) => source.id === sourceId) ?? null;
  if (source == null) {
    throw HTTPError.status(404, `Source "${sourceId}" not found`);
  }

  const { files } = await resolveSourceFiles(source);
  const file = files.find((file) => file.id === fileId) ?? null;

  if (file == null) {
    throw HTTPError.status(404, `File "${fileId}" not found in source "${source.id}"`);
  }

  return {
    id: file.id,
    path: file.relativePath,
    label: file.label,
    sourceId: source.id,
    pipelines: file.pipelines.map((pipeline) => toPipelineInfo(pipeline)),
  } satisfies SourceFileResponse;
});

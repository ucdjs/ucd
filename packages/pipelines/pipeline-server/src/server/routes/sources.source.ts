import type { LoadedSourceData } from "#server/lib/files";
import type { SourceDetail, SourceFileResponse, SourceList } from "@ucdjs/pipelines-ui/schemas";
import {
  fileErrorsByFileId,
  fileErrorsForPath,
  sourceErrors,
  unmatchedFileErrors,
} from "#server/lib/files";
import { fileIdFromPath, fileLabelFromPath } from "#server/lib/ids";
import { syncRemoteSource } from "@ucdjs/pipelines-loader";
import { H3, HTTPError } from "h3";

export const sourcesSourceRouter: H3 = new H3();

function buildSourceFiles(data: LoadedSourceData): SourceDetail["files"] {
  const files = data.fileGroups.map((fileGroup) => {
    const matchedErrors = fileErrorsForPath(data.errors, fileGroup.filePath, fileGroup.sourceFilePath);

    return {
      fileId: fileGroup.fileId,
      filePath: fileGroup.filePath,
      sourceFilePath: fileGroup.sourceFilePath,
      fileLabel: fileGroup.fileLabel,
      sourceId: fileGroup.sourceId,
      pipelineCount: fileGroup.pipelines.length,
      hasErrors: matchedErrors.length > 0,
      errorCount: matchedErrors.length,
      pipelines: fileGroup.pipelines.slice(0, 3),
    };
  });

  const extras = unmatchedFileErrors(data.errors, data.fileGroups);
  for (const error of extras) {
    if (!error.filePath) {
      continue;
    }

    const fileId = fileIdFromPath(error.filePath);
    const existing = files.find((file) => file.fileId === fileId);
    if (existing) {
      existing.hasErrors = true;
      existing.errorCount += 1;
      continue;
    }

    files.push({
      fileId,
      filePath: error.filePath,
      sourceFilePath: error.filePath,
      fileLabel: fileLabelFromPath(error.filePath),
      sourceId: data.sourceId,
      pipelineCount: 0,
      hasErrors: true,
      errorCount: 1,
      pipelines: [],
    });
  }

  files.sort((a, b) => a.fileLabel.localeCompare(b.fileLabel));
  return files;
}

sourcesSourceRouter.get("/", async (event) => {
  const loaded = await event.context.getAllSourcesData();

  return {
    sources: loaded.map((entry) => {
      const files = buildSourceFiles(entry);
      const pipelines = entry.fileGroups.flatMap((fileGroup) => fileGroup.pipelines);

      return {
        id: entry.sourceId,
        type: entry.source.type,
        hasErrors: entry.errors.length > 0,
        fileCount: files.length,
        pipelineCount: files.reduce((sum, file) => sum + file.pipelineCount, 0),
        pipelines,
      };
    }),
  } satisfies SourceList;
});

sourcesSourceRouter.get("/:sourceId", async (event) => {
  const sourceId = event.context.params!.sourceId!;
  const data = await event.context.getSourceData(sourceId);
  if (!data) {
    throw HTTPError.status(404, "Not Found", { message: `Source \"${sourceId}\" not found` });
  }

  return {
    sourceId,
    files: buildSourceFiles(data),
    sourceErrors: sourceErrors(data.errors),
  } satisfies SourceDetail;
});

sourcesSourceRouter.post("/:sourceId/refresh", async (event) => {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;

  if (!sourceId) {
    return { error: "Source ID is required" };
  }

  const source = sources.find((s: { id: string }) => s.id === sourceId);
  if (!source) {
    return { error: `Source \"${sourceId}\" not found` };
  }

  if (source.type === "local") {
    return { error: "Cannot refresh local sources" };
  }

  const { type, owner, repo, ref = "HEAD" } = source;

  try {
    const result = await syncRemoteSource({
      source: type,
      owner,
      repo,
      ref,
      force: false,
    });

    if (!result.success) {
      return {
        error: "Failed to refresh source",
        message: result.error?.message ?? "Unknown error",
      };
    }

    return {
      sourceId,
      source: type,
      owner,
      repo,
      ref,
      updated: result.updated,
      previousSha: result.previousSha,
      newSha: result.newSha,
      syncedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      error: "Failed to refresh source",
      message: err instanceof Error ? err.message : String(err),
    };
  }
});

sourcesSourceRouter.get("/:sourceId/:fileId", async (event) => {
  const sourceId = event.context.params?.sourceId;
  const fileId = event.context.params?.fileId;

  if (!sourceId || !fileId) {
    return { error: "Source ID and File ID are required" };
  }

  const data = await event.context.getSourceData(sourceId);
  if (!data) {
    throw HTTPError.status(404, "Not Found", { message: `Source \"${sourceId}\" not found` });
  }
  const matchedGroup = data.fileGroups.find((entry) => entry.fileId === fileId);

  if (matchedGroup) {
    return {
      sourceId,
      fileId,
      file: {
        fileId: matchedGroup.fileId,
        filePath: matchedGroup.filePath,
        sourceFilePath: matchedGroup.sourceFilePath,
        fileLabel: matchedGroup.fileLabel,
        sourceId: matchedGroup.sourceId,
        pipelines: matchedGroup.pipelines,
        errors: fileErrorsForPath(data.errors, matchedGroup.filePath, matchedGroup.sourceFilePath),
      },
      sourceErrors: sourceErrors(data.errors),
    } satisfies SourceFileResponse;
  }

  const errorsForFileId = fileErrorsByFileId(data.errors, fileId);
  if (errorsForFileId.length > 0) {
    const firstErrorPath = errorsForFileId[0]?.filePath;
    if (!firstErrorPath) {
      throw HTTPError.status(500, "Internal Server Error", {
        message: `Missing file path for file-scoped error in source \"${sourceId}\"`,
      });
    }

    return {
      sourceId,
      fileId,
      file: {
        fileId,
        filePath: firstErrorPath,
        sourceFilePath: firstErrorPath,
        fileLabel: fileLabelFromPath(firstErrorPath),
        sourceId,
        pipelines: [],
        errors: errorsForFileId,
      },
      sourceErrors: sourceErrors(data.errors),
    } satisfies SourceFileResponse;
  }

  throw HTTPError.status(404, "Not Found", { message: `Pipeline file \"${fileId}\" not found in source \"${sourceId}\"` });
});

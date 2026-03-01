import type { PipelineLoadErrorInfo } from "#server/lib/files";
import type { PipelineInfo } from "@ucdjs/pipelines-ui";
import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

export function configQueryOptions() {
  return queryOptions({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json() as Promise<{ workspaceId: string; version: string }>;
    },
    // Static config, never refetch
    staleTime: Infinity,
  });
}

export function sourcesQueryOptions() {
  return queryOptions({
    queryKey: ["sources"],
    queryFn: async () => {
      const res = await fetch("/api/sources");
      if (!res.ok) throw new Error("Failed to fetch sources");
      return res.json() as Promise<{
        id: string;
        type: string;
      }[]>;
    },
  });
}

export function sourceQueryOptions(sourceId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw notFound({
            data: {
              message: "Source not found",
            },
          });
        }

        throw new Error("Failed to fetch source");
      }

      return res.json() as Promise<{
        sourceId: string;
        files: {
          fileId: string;
          filePath: string;
          sourceFilePath: string | undefined;
          fileLabel: string;
          sourceId: string;
          pipelines: PipelineInfo[];
        }[];
        errors: PipelineLoadErrorInfo[];
      }>;
    },
  });
}

export function sourceFileQueryOptions(sourceId: string, fileId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}`);
      if (!res.ok) throw new Error("Failed to fetch file");
      return res.json() as Promise<{
        sourceId: string;
        fileId: string;
        file: {
          fileId: string;
          filePath: string;
          sourceFilePath: string | undefined;
          fileLabel: string;
          sourceId: string;
          pipelines: PipelineInfo[];
        };
        errors: PipelineLoadErrorInfo[];
      }>;
    },
  });
}

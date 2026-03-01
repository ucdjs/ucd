import type { PipelineLoadErrorInfo } from "#server/lib/files";
import type { PipelineInfo } from "@ucdjs/pipelines-ui";
import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";

// Zod schemas for API response validation
const PipelineInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  versions: z.array(z.string()),
  routeCount: z.number(),
  sourceCount: z.number(),
  sourceId: z.string(),
});

const PipelineLoadErrorSchema = z.object({
  filePath: z.string(),
  message: z.string(),
  sourceId: z.string(),
});

const ConfigSchema = z.object({
  workspaceId: z.string(),
  version: z.string(),
});

const SourceSchema = z.object({
  id: z.string(),
  type: z.string(),
});

const FileSchema = z.object({
  fileId: z.string(),
  filePath: z.string(),
  sourceFilePath: z.string().optional(),
  fileLabel: z.string(),
  sourceId: z.string(),
  pipelines: z.array(PipelineInfoSchema),
});

const SourceResponseSchema = z.object({
  sourceId: z.string(),
  files: z.array(FileSchema),
  errors: z.array(PipelineLoadErrorSchema),
});

const SourceFileResponseSchema = z.object({
  sourceId: z.string(),
  fileId: z.string(),
  file: FileSchema,
  errors: z.array(PipelineLoadErrorSchema),
});

export function configQueryOptions() {
  return queryOptions({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();
      return ConfigSchema.parse(data);
    },
    staleTime: Infinity,
  });
}

export function sourcesQueryOptions() {
  return queryOptions({
    queryKey: ["sources"],
    queryFn: async () => {
      const res = await fetch("/api/sources");
      if (!res.ok) throw new Error("Failed to fetch sources");
      const data = await res.json();
      return z.array(SourceSchema).parse(data);
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
      const data = await res.json();
      return SourceResponseSchema.parse(data);
    },
  });
}

export function sourceFileQueryOptions(sourceId: string, fileId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}`);
      if (!res.ok) throw new Error("Failed to fetch file");
      const data = await res.json();
      return SourceFileResponseSchema.parse(data);
    },
  });
}

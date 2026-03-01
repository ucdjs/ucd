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

const PipelineDetailsSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  versions: z.array(z.string()),
  routeCount: z.number(),
  sourceCount: z.number(),
  routes: z.array(z.object({
    id: z.string(),
    cache: z.boolean(),
    depends: z.array(z.any()),
    emits: z.array(z.object({ id: z.string(), scope: z.enum(["version", "global"]) })),
    outputs: z.array(z.object({ dir: z.string().optional(), fileName: z.string().optional() })),
    transforms: z.array(z.string()),
  })),
  sources: z.array(z.object({ id: z.string() })),
});

const PipelineResponseSchema = z.object({
  pipeline: PipelineDetailsSchema.optional(),
  error: z.string().optional(),
  fileId: z.string().optional(),
  filePath: z.string().optional(),
  fileLabel: z.string().optional(),
  sourceId: z.string().optional(),
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

export function pipelineQueryOptions(sourceId: string, fileId: string, pipelineId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw notFound({
            data: {
              message: "Pipeline not found",
            },
          });
        }
        throw new Error("Failed to fetch pipeline");
      }
      const data = await res.json();
      return PipelineResponseSchema.parse(data);
    },
  });
}

const ExecutionSchema = z.object({
  id: z.string(),
  pipelineId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  versions: z.array(z.string()).nullable(),
  summary: z.object({
    totalRoutes: z.number().optional(),
    cached: z.number().optional(),
  }).nullable(),
  hasGraph: z.boolean().optional(),
  error: z.string().nullable(),
});

const ExecutionsResponseSchema = z.object({
  executions: z.array(ExecutionSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

export function executionsQueryOptions(sourceId: string, fileId: string, pipelineId: string, limit: number = 10) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", { limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/executions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch executions");
      const data = await res.json();
      return ExecutionsResponseSchema.parse(data);
    },
  });
}

const CodeResponseSchema = z.object({
  code: z.string().optional(),
  filePath: z.string().optional(),
  fileLabel: z.string().optional(),
  fileId: z.string().optional(),
  sourceId: z.string().optional(),
  error: z.string().optional(),
});

export function codeQueryOptions(sourceId: string, fileId: string, pipelineId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "code"],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/code`);
      if (!res.ok) throw new Error("Failed to fetch code");
      const data = await res.json();
      return CodeResponseSchema.parse(data);
    },
  });
}

const ExecutionEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.string(),
  data: z.any(),
});

const ExecutionEventsResponseSchema = z.object({
  executionId: z.string(),
  pipelineId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  events: z.array(ExecutionEventSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

export function executionEventsQueryOptions(sourceId: string, fileId: string, pipelineId: string, executionId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "events"],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/events?limit=500`);
      if (!res.ok) throw new Error("Failed to fetch execution events");
      const data = await res.json();
      return ExecutionEventsResponseSchema.parse(data);
    },
  });
}

const ExecutionLogItemSchema = z.object({
  id: z.string(),
  spanId: z.string().nullable(),
  stream: z.enum(["stdout", "stderr"]),
  message: z.string(),
  timestamp: z.string(),
  payload: z.any().nullable(),
});

const ExecutionLogsResponseSchema = z.object({
  executionId: z.string(),
  pipelineId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  logs: z.array(ExecutionLogItemSchema),
  truncated: z.boolean(),
  capturedSize: z.number(),
  originalSize: z.number().nullable(),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

export function executionLogsQueryOptions(sourceId: string, fileId: string, pipelineId: string, executionId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "logs"],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/logs?limit=500`);
      if (!res.ok) throw new Error("Failed to fetch execution logs");
      const data = await res.json();
      return ExecutionLogsResponseSchema.parse(data);
    },
  });
}

const PipelineGraphSchema = z.object({
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

const ExecutionGraphResponseSchema = z.object({
  graph: PipelineGraphSchema.nullable(),
});

export function executionGraphQueryOptions(sourceId: string, fileId: string, pipelineId: string, executionId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "graph"],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/graph`);
      if (!res.ok) throw new Error("Failed to fetch execution graph");
      const data = await res.json();
      return ExecutionGraphResponseSchema.parse(data);
    },
  });
}

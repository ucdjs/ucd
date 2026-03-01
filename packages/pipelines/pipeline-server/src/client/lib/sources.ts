import { queryOptions } from "@tanstack/react-query";

export function sourceFilesQueryOptions(sourceId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files"],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}`);
      if (!res.ok) throw new Error("Failed to fetch source files");
      return res.json();
    },
  });
}

export function sourceFilePipelineQueryOptions(sourceId: string, fileId: string, pipelineId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}`);
      if (!res.ok) throw new Error("Failed to fetch pipeline");
      return res.json();
    },
  });
}

export function pipelineCodeQueryOptions(sourceId: string, fileId: string, pipelineId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "code"],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/code`);
      if (!res.ok) throw new Error("Failed to fetch code");
      return res.json();
    },
  });
}

export function pipelineExecutionsQueryOptions(sourceId: string, fileId: string, pipelineId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions"],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/executions`);
      if (!res.ok) throw new Error("Failed to fetch executions");
      return res.json();
    },
  });
}

export function pipelineGraphQueryOptions(sourceId: string, fileId: string, pipelineId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "graph"],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/graph`);
      if (!res.ok) throw new Error("Failed to fetch graph");
      return res.json();
    },
  });
}

export function pipelineGraphsQueryOptions(sourceId: string, fileId: string, pipelineId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "graphs"],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/graphs`);
      if (!res.ok) throw new Error("Failed to fetch graphs");
      return res.json();
    },
  });
}

export function pipelineInspectQueryOptions(sourceId: string, fileId: string, pipelineId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "inspect"],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/inspect`);
      if (!res.ok) throw new Error("Failed to fetch inspect");
      return res.json();
    },
  });
}

export function executionQueryOptions(sourceId: string, fileId: string, pipelineId: string, executionId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}`);
      if (!res.ok) throw new Error("Failed to fetch execution");
      return res.json();
    },
  });
}

export function executionGraphQueryOptions(sourceId: string, fileId: string, pipelineId: string, executionId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "graph"],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/graph`);
      if (!res.ok) throw new Error("Failed to fetch execution graph");
      return res.json();
    },
  });
}

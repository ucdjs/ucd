import type { WithBaseUrl } from "#lib/functions";
import type { SourceFileResponse, SourceList, SourceSummary } from "../schemas/source";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import {
  SourceFileResponseSchema,
  SourceListSchema,
  SourceSummarySchema,
} from "../schemas/source";

export interface SourceParams {
  sourceId: string;
}

export interface SourceFileParams extends SourceParams {
  fileId: string;
}

export async function fetchSources(options: WithBaseUrl): Promise<SourceList> {
  const { baseUrl = "" } = options;
  const { data, error } = await customFetch.safe(`${baseUrl}/api/sources`, {
    schema: SourceListSchema,
  });

  if (error) {
    throw new Error(`Failed to fetch sources: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to fetch sources: No data returned");
  }

  return data;
}

export async function fetchSource(options: WithBaseUrl<SourceParams>): Promise<SourceSummary | null> {
  const { baseUrl = "", sourceId } = options;
  const { data, error } = await customFetch.safe(`${baseUrl}/api/sources/${sourceId}`, {
    schema: SourceSummarySchema,
  });

  if (error) {
    if (error.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch source with id ${sourceId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to fetch source with id ${sourceId}: No data returned`);
  }

  return data;
}

export async function fetchSourceFile(options: WithBaseUrl<SourceFileParams>): Promise<SourceFileResponse | null> {
  const { baseUrl = "", sourceId, fileId } = options;
  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/sources/${sourceId}/${fileId}`,
    {
      schema: SourceFileResponseSchema,
    },
  );

  if (error) {
    if (error.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch file with id ${fileId} for source with id ${sourceId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      `Failed to fetch file with id ${fileId} for source with id ${sourceId}: No data returned`,
    );
  }

  return data;
}

export function sourcesQueryOptions(options: WithBaseUrl) {
  const { baseUrl = "" } = options;
  return queryOptions({
    queryKey: ["sources", { baseUrl }],
    queryFn: () => fetchSources({ baseUrl }),
  });
}

export function sourceQueryOptions(options: WithBaseUrl<SourceParams>) {
  const { baseUrl = "", sourceId } = options;
  return queryOptions({
    queryKey: ["sources", sourceId],
    queryFn: () => fetchSource({ baseUrl, sourceId }),
  });
}

export function sourceFileQueryOptions(options: WithBaseUrl<SourceFileParams>) {
  const { baseUrl = "", sourceId, fileId } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId],
    queryFn: () => fetchSourceFile({ baseUrl, sourceId, fileId }),
  });
}

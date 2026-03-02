import type { SourceDetail, SourceFileResponse, SourceList } from "../schemas/source";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { SourceDetailSchema, SourceFileResponseSchema, SourceListSchema } from "../schemas/source";

export async function fetchSources(baseUrl: string): Promise<SourceList> {
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

export async function fetchSource(
  baseUrl: string,
  sourceId: string,
): Promise<SourceDetail> {
  const { data, error } = await customFetch.safe(`${baseUrl}/api/sources/${sourceId}`, {
    schema: SourceDetailSchema,
  });

  if (error) {
    throw new Error(`Failed to fetch source with id ${sourceId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to fetch source with id ${sourceId}: No data returned`);
  }

  return data;
}

export async function fetchSourceFile(
  baseUrl: string,
  sourceId: string,
  fileId: string,
): Promise<SourceFileResponse> {
  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/sources/${sourceId}/${fileId}`,
    {
      schema: SourceFileResponseSchema,
    },
  );

  if (error) {
    throw new Error(`Failed to fetch file with id ${fileId} for source with id ${sourceId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      `Failed to fetch file with id ${fileId} for source with id ${sourceId}: No data returned`,
    );
  }

  return data;
}

export function sourcesQueryOptions(baseUrl: string) {
  return queryOptions({
    queryKey: ["sources"],
    queryFn: () => fetchSources(baseUrl),
  });
}

export function sourceQueryOptions(baseUrl: string, sourceId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId],
    queryFn: () => fetchSource(baseUrl, sourceId),
  });
}

export function sourceFileQueryOptions(baseUrl: string, sourceId: string, fileId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId],
    queryFn: () => fetchSourceFile(baseUrl, sourceId, fileId),
  });
}

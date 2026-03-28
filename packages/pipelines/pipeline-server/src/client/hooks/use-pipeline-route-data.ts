import { pipelineQueryOptions } from "#queries/pipeline";
import { sourceQueryOptions } from "#queries/source";
import { isNotFoundError } from "#queries/utils";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export interface UsePipelineRouteDataOptions {
  sourceId: string;
  fileId: string;
  pipelineId: string;
}

export function usePipelineRouteData({
  sourceId,
  fileId,
  pipelineId,
}: UsePipelineRouteDataOptions) {
  const navigate = useNavigate();
  const sourceQuery = useQuery(sourceQueryOptions({ sourceId }));
  const source = sourceQuery.data ?? null;
  const file = source?.files.find((entry) => entry.id === fileId) ?? null;
  const pipelineExists = file?.pipelines.some((entry) => entry.id === pipelineId) ?? false;

  const pipelineQuery = useQuery({
    ...pipelineQueryOptions({
      sourceId,
      fileId,
      pipelineId,
    }),
    enabled: pipelineExists,
  });

  const pipelineNotFound = isNotFoundError(pipelineQuery.error);
  const isMissing = !!source && (!file || !pipelineExists || pipelineNotFound);
  const isPending = sourceQuery.isPending || (pipelineExists && pipelineQuery.isPending && !pipelineQuery.data);

  useEffect(() => {
    if (!isMissing) {
      return;
    }

    void navigate({
      to: "/s/$sourceId",
      params: { sourceId },
      replace: true,
    });
  }, [isMissing, navigate, sourceId]);

  return {
    source,
    file,
    pipeline: pipelineQuery.data ?? null,
    isMissing,
    isPending,
  };
}

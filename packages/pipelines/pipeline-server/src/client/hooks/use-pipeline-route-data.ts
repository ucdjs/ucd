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
  const hasFile = file != null;
  const pipelineQuery = useQuery({
    ...pipelineQueryOptions({
      sourceId,
      fileId,
      pipelineId,
    }),
    enabled: hasFile,
  });

  const pipelineNotFound = isNotFoundError(pipelineQuery.error);
  const isMissing = !!source && (!file || !hasFile || pipelineNotFound);
  const isPending = sourceQuery.isPending || (hasFile && pipelineQuery.isPending && !pipelineQuery.data);

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

import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Play } from "lucide-react";
import { useCallback } from "react";
import { sourceFileQueryOptions } from "../functions/file";
import { pipelineQueryOptions } from "../functions/pipeline";
import { useExecute } from "../hooks/use-execute";

export interface PipelineHeaderProps {
  selectedVersions: Set<string>;
}

function usePipelineRouteParams() {
  const params = useParams({ strict: false });
  const sourceId = "sourceId" in params && typeof params.sourceId === "string" ? params.sourceId : null;
  const sourceFileId = "sourceFileId" in params && typeof params.sourceFileId === "string" ? params.sourceFileId : null;
  const pipelineId = "pipelineId" in params && typeof params.pipelineId === "string" ? params.pipelineId : null;

  if (!sourceId || !sourceFileId || !pipelineId) {
    throw new Error("PipelineHeader must be used within a pipeline route.");
  }

  return {
    sourceId,
    sourceFileId,
    pipelineId,
  };
}

export function PipelineHeader({ selectedVersions }: PipelineHeaderProps) {
  const { sourceId, sourceFileId, pipelineId } = usePipelineRouteParams();
  const navigate = useNavigate();
  const { data: file } = useSuspenseQuery(sourceFileQueryOptions({
    sourceId,
    fileId: sourceFileId,
  }));
  const { data: pipelineResponse } = useSuspenseQuery(pipelineQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
  }));
  const { execute, executing, executionId } = useExecute();
  const pipeline = pipelineResponse.pipeline;

  const handleExecute = useCallback(async () => {
    const result = await execute(sourceId, sourceFileId, pipelineId, Array.from(selectedVersions));
    if (result.success && result.executionId) {
      navigate({
        to: "/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId",
        params: {
          sourceId,
          sourceFileId,
          pipelineId,
          executionId: result.executionId,
        },
      });
    }
  }, [execute, navigate, pipelineId, selectedVersions, sourceFileId, sourceId]);

  return (
    <div className="px-6 py-4">
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="min-w-60 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 min-h-6">
            <h1 className="text-base font-semibold text-foreground tracking-tight">
              {pipeline.name || pipeline.id}
            </h1>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline.versions.length}
              {" "}
              versions
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline.routeCount}
              {" "}
              routes
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline.sourceCount}
              {" "}
              sources
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            {pipeline.description ?? "No description provided."}
          </p>
          <p className="text-[11px] text-muted-foreground/80">{file.label}</p>
        </div>

        <div className="flex items-center gap-2">
          {executionId && !executing && (
            <Button
              variant="outline"
              size="sm"
              render={(props) => (
                <Link
                  to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId"
                  params={{ sourceId, sourceFileId, pipelineId, executionId }}
                  {...props}
                >
                  View Execution
                </Link>
              )}
            />
          )}
          <Button
            disabled={executing || selectedVersions.size === 0}
            onClick={handleExecute}
          >
            <Play className="h-4 w-4 mr-2" />
            {executing ? "Running..." : "Execute"}
          </Button>
        </div>
      </div>
    </div>
  );
}

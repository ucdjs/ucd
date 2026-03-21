import type { ExecutionSummaryItem } from "#queries/execution";
import type { PipelineDetails } from "#queries/pipeline";
import { useExecute } from "#hooks/use-execute";
import { usePipelineVersions } from "#hooks/use-pipeline-versions";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { FileCode2, Play } from "lucide-react";
import { useCallback } from "react";
import { VersionSelector } from "./version-selector";

export interface PipelineHeaderProps {
  pipeline: PipelineDetails;
  sourceLabel: string;
  fileLabel: string;
  filePath: string;
  latestExecution: ExecutionSummaryItem | null;
}

export function PipelineHeader({
  pipeline,
  sourceLabel,
  fileLabel,
  filePath,
  latestExecution,
}: PipelineHeaderProps) {
  const { sourceId, sourceFileId, pipelineId } = useParams({ from: "/s/$sourceId/$sourceFileId/$pipelineId" });
  const navigate = useNavigate();
  const { execute, executing, executionId } = useExecute();
  const versionStorageKey = `${sourceId}:${sourceFileId}:${pipelineId}`;
  const { selectedVersions } = usePipelineVersions(versionStorageKey, pipeline.versions);

  const handleExecute = useCallback(async () => {
    const result = await execute(sourceId, sourceFileId, pipelineId, [...selectedVersions]);
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
    <div className="border-b border-border/60 bg-background px-4 py-4 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/s/$sourceId" params={{ sourceId }}>{sourceLabel}</Link>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/s/$sourceId/$sourceFileId" params={{ sourceId, sourceFileId }}>{fileLabel}</Link>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pipeline.name || pipeline.id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-3">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {pipeline.name || pipeline.id}
          </h1>

          {pipeline.description && (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {pipeline.description}
            </p>
          )}

          <div className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <FileCode2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{filePath}</span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end xl:w-auto">
          <VersionSelector
            storageKey={versionStorageKey}
            versions={pipeline.versions}
            className="w-full justify-between sm:w-auto"
          />
          {(executionId || latestExecution) && !executing && (
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              render={(props) => (
                <Link
                  to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId"
                  params={{
                    sourceId,
                    sourceFileId,
                    pipelineId,
                    executionId: executionId ?? latestExecution!.id,
                  }}
                  {...props}
                >
                  View latest execution
                </Link>
              )}
            />
          )}
          <Button
            disabled={executing || selectedVersions.size === 0}
            size="sm"
            onClick={handleExecute}
          >
            <Play className="mr-2 h-4 w-4" />
            {executing ? "Running..." : "Execute"}
          </Button>
        </div>
      </div>
    </div>
  );
}

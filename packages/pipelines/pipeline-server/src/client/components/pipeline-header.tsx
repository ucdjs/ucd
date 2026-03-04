import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useLoaderData, useNavigate, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { SidebarTrigger } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { useExecute, usePipelineVersions } from "@ucdjs/pipelines-ui";
import { pipelineQueryOptions } from "@ucdjs/pipelines-ui/functions";
import { CheckCircle, Loader2, Play } from "lucide-react";
import { useCallback } from "react";

export function PipelineHeader() {
  const { sourceId, fileId, pipelineId } = useParams({ from: "/$sourceId/$fileId/$pipelineId" });
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(
    pipelineQueryOptions({ sourceId, fileId, pipelineId }),
  );
  const { file } = useLoaderData({ from: "/$sourceId/$fileId" });
  const pipeline = data?.pipeline;
  const { execute, executing, executionId } = useExecute();
  const allVersions = pipeline?.versions ?? [];
  const { selectedVersions } = usePipelineVersions(pipelineId, allVersions, `${fileId}:${pipelineId}`);

  const canExecute = selectedVersions.size > 0;

  const handleExecute = useCallback(async () => {
    if (!canExecute) return;
    const result = await execute({ fileId, pipelineId, versions: Array.from(selectedVersions), sourceId });
    // Navigate to execution detail after successful execution
    if (result.success && result.executionId) {
      navigate({
        to: "/$sourceId/$fileId/$pipelineId/executions/$executionId",
        params: { sourceId, fileId, pipelineId, executionId: result.executionId },
      });
    }
  }, [execute, sourceId, fileId, pipelineId, selectedVersions, canExecute, navigate]);

  return (
    <header className="px-6 py-4">
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="min-w-60 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 min-h-6">
            <SidebarTrigger className="shrink-0" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link to="/$sourceId" params={{ sourceId }} />}>
                    {sourceId}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link to="/$sourceId/$fileId" params={{ sourceId, fileId }} />}>
                    {file.fileLabel}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pipeline?.name || pipeline?.id}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pl-8">
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline?.versions.length ?? 0}
              {" "}
              versions
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline?.routeCount ?? 0}
              {" "}
              routes
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline?.sourceCount ?? 0}
              {" "}
              sources
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {executionId && !executing && (
            <Button
              variant="outline"
              size="sm"
              render={(props) => (
                <Link
                  to="/$sourceId/$fileId/$pipelineId/executions/$executionId"
                  params={{ sourceId, fileId, pipelineId, executionId }}
                  {...props}
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  View Execution
                </Link>
              )}
            />
          )}
          <Button
            size="sm"
            disabled={!canExecute || executing || !pipeline}
            onClick={handleExecute}
          >
            {executing
              ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                )
              : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </>
                )}
          </Button>
        </div>
      </div>
    </header>
  );
}

PipelineHeader.Skeleton = function PipelineHeaderSkeleton() {
  return (
    <header className="px-6 py-4">
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="min-w-60 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 min-h-6">
            <SidebarTrigger className="shrink-0" />
            <span className="w-24 h-4 rounded bg-muted animate-pulse" />
            <span className="mx-1 text-muted-foreground/30">/</span>
            <span className="w-20 h-4 rounded bg-muted animate-pulse" />
            <span className="mx-1 text-muted-foreground/30">/</span>
            <span className="w-28 h-4 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pl-8">
            <span className="w-18 h-5 rounded-full bg-muted animate-pulse" />
            <span className="w-14 h-5 rounded-full bg-muted animate-pulse" />
            <span className="w-16 h-5 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-24 h-8 rounded-md bg-muted animate-pulse" />
        </div>
      </div>
    </header>
  );
};

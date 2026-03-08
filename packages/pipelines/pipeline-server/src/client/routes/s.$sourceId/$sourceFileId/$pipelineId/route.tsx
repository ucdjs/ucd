import { createFileRoute, Link, notFound, Outlet, useNavigate } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import {
  isNotFoundError,
  pipelineQueryOptions,
  sourceFileQueryOptions,
  useExecute,
  usePipelineVersions,
  VersionSelector,
} from "@ucdjs/pipelines-ui";
import { Play } from "lucide-react";
import { useCallback } from "react";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId")({
  loader: async ({ context, params }) => {
    try {
      const [file, pipelineResponse] = await Promise.all([
        context.queryClient.ensureQueryData(sourceFileQueryOptions({
          sourceId: params.sourceId,
          fileId: params.sourceFileId,
        })),
        context.queryClient.ensureQueryData(pipelineQueryOptions({
          sourceId: params.sourceId,
          fileId: params.sourceFileId,
          pipelineId: params.pipelineId,
        })),
      ]);

      return {
        file,
        pipelineResponse,
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        throw notFound();
      }

      throw error;
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const navigate = useNavigate();
  const { file, pipelineResponse } = Route.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const { selectedVersions, toggleVersion, selectAll, deselectAll } = usePipelineVersions(
    pipelineId,
    pipeline.versions,
    `${sourceId}:${sourceFileId}:${pipelineId}`,
  );
  const { execute, executing, executionId } = useExecute();

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
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border shrink-0">
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
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <VersionSelector
            versions={pipeline.versions}
            selectedVersions={selectedVersions}
            onToggleVersion={toggleVersion}
            onSelectAll={() => selectAll(pipeline.versions)}
            onDeselectAll={deselectAll}
          />
        </div>
        <nav
          className="px-6 pt-4 flex flex-wrap gap-1 border-b border-border"
          role="tablist"
          aria-label="Pipeline sections"
        >
          <Link
            to="/s/$sourceId/$sourceFileId/$pipelineId"
            params={{ sourceId, sourceFileId, pipelineId }}
            activeOptions={{ exact: true }}
            className="px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px"
            activeProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-primary text-primary bg-primary/5") }}
            inactiveProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50") }}
          >
            Overview
          </Link>
          <Link
            to="/s/$sourceId/$sourceFileId/$pipelineId/inspect"
            params={{ sourceId, sourceFileId, pipelineId }}
            className="px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px"
            activeProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-primary text-primary bg-primary/5") }}
            inactiveProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50") }}
          >
            Inspect
          </Link>
          <Link
            to="/s/$sourceId/$sourceFileId/$pipelineId/executions"
            params={{ sourceId, sourceFileId, pipelineId }}
            className="px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px"
            activeProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-primary text-primary bg-primary/5") }}
            inactiveProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50") }}
          >
            Executions
          </Link>
          <Link
            to="/s/$sourceId/$sourceFileId/$pipelineId/graphs"
            params={{ sourceId, sourceFileId, pipelineId }}
            className="px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px"
            activeProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-primary text-primary bg-primary/5") }}
            inactiveProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50") }}
          >
            Graphs
          </Link>
        </nav>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        <Outlet />
      </div>
    </div>
  );
}

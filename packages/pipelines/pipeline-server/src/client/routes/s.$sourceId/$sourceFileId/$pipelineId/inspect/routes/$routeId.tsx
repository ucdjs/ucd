import { DefinitionGraph } from "#components/inspect/definition-graph";
import { createFileRoute, getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button, buttonVariants } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowRight, FileOutput, FolderOutput, Link2, Shuffle, Spline } from "lucide-react";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId")({
  component: RouteDetailPage,
});

function RouteDetailPage() {
  const { pipeline } = PipelineRoute.useLoaderData();
  const { sourceId, sourceFileId, pipelineId, routeId } = Route.useParams();
  const navigate = useNavigate();

  const selectedRoute = pipeline.routes.find((route) => route.id === routeId);

  if (!selectedRoute) {
    return (
      <div className="rounded-lg border border-border/60 px-4 py-10 text-sm text-muted-foreground">
        Route &ldquo;
        {routeId}
        &rdquo; not found in this pipeline.
      </div>
    );
  }

  function handleRouteSelect(id: string) {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId",
      params: { sourceId, sourceFileId, pipelineId, routeId: id },
    });
  }

  function handleOutputSelect(outputKey: string) {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs/$outputKey",
      params: { sourceId, sourceFileId, pipelineId, outputKey },
    });
  }

  return (
    <Card>
      <CardContent className="divide-y divide-border/60 p-0">
        <div className="space-y-5 bg-muted/5 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted/10">
                <Spline className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight">{selectedRoute.id}</h2>
                {selectedRoute.cache
                  ? <Badge variant="secondary">Cacheable</Badge>
                  : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/10 px-2.5 py-1">
                <Link2 className="h-3 w-3" />
                <span className="font-semibold tabular-nums text-foreground">{selectedRoute.depends.length}</span>
                depends
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/10 px-2.5 py-1">
                <Shuffle className="h-3 w-3" />
                <span className="font-semibold tabular-nums text-foreground">{selectedRoute.transforms.length}</span>
                transforms
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/10 px-2.5 py-1">
                <FolderOutput className="h-3 w-3" />
                <span className="font-semibold tabular-nums text-foreground">{selectedRoute.outputs.length}</span>
                outputs
              </span>
            </div>
          </div>

          <div className="grid gap-4 border-t border-border/60 pt-4 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Route filter</div>
              <code className="block break-all rounded-lg border border-border/60 bg-muted/10 px-3 py-3 text-sm">
                {selectedRoute.filter ?? "Custom filter"}
              </code>
            </div>
            {pipeline.include && (
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Pipeline scope</div>
                <code className="block break-all rounded-lg border border-border/60 bg-muted/10 px-3 py-3 text-sm">
                  {pipeline.include}
                </code>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 px-6 pt-5">
            <Spline className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-base font-semibold">Route neighbors</h3>
            <span className="text-xs text-muted-foreground">Direct dependencies and dependents</span>
          </div>
          <div className="h-56">
            <DefinitionGraph
              pipeline={pipeline}
              selectedRouteId={selectedRoute.id}
              onRouteSelect={handleRouteSelect}
              onOutputSelect={handleOutputSelect}
              includeOutputs
              mode="neighbors"
              className="h-56"
            />
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-base font-semibold">Dependencies</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedRoute.depends.length
              ? selectedRoute.depends.map((dependency) => (
                  <Link
                    key={`${dependency.type}-${dependency.routeId}`}
                    to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId"
                    params={{ sourceId, sourceFileId, pipelineId, routeId: dependency.routeId }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
                  >
                    <Spline className="h-3 w-3" />
                    route:
                    {" "}
                    {dependency.routeId}
                  </Link>
                ))
              : <span className="text-sm text-muted-foreground">No dependencies.</span>}
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center gap-2">
            <Shuffle className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-base font-semibold">Transforms</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedRoute.transforms.length
              ? selectedRoute.transforms.map((transform) => (
                  <Button
                    key={transform}
                    nativeButton={false}
                    variant="outline"
                    render={(props) => (
                      <Link
                        to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms/$transformName"
                        params={{ sourceId, sourceFileId, pipelineId, transformName: transform }}
                        {...props}
                      >
                        {transform}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  />
                ))
              : <span className="text-sm text-muted-foreground">No transforms.</span>}
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center gap-2">
            <FolderOutput className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-base font-semibold">Outputs</h3>
          </div>
          {selectedRoute.outputs.length
            ? (
                <div className="grid gap-3">
                  {selectedRoute.outputs.map((output, idx) => (
                    <div key={`${output.dir ?? "none"}-${output.fileName ?? "none"}`} className="rounded-lg border border-border/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileOutput className="h-3.5 w-3.5 text-muted-foreground" />
                          Output
                          {" "}
                          {idx + 1}
                        </div>
                        <Link
                          to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs/$outputKey"
                          params={{ sourceId, sourceFileId, pipelineId, outputKey: `${selectedRoute.id}:${idx}` }}
                          className={buttonVariants({ variant: "outline" })}
                        >
                          Open output
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Directory</div>
                          <div className="text-sm text-foreground">{output.dir ?? "Default route output directory"}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">File name</div>
                          <div className="text-sm text-foreground">{output.fileName ?? "Generated by route configuration"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            : (
                <div className="rounded-md border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
                  No output definitions for this route.
                </div>
              )}
        </div>
      </CardContent>
    </Card>
  );
}

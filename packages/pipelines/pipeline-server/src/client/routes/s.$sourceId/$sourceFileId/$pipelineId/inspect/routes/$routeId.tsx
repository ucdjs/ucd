import type { PipelineDetails } from "#shared/schemas/pipeline";
import { DefinitionGraph } from "#components/inspect/definition-graph";
import { createFileRoute, getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowRight, FileOutput, FolderOutput, Link2, Package, Shuffle, Spline } from "lucide-react";
import { useMemo } from "react";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId")({
  component: RouteDetailPage,
});

function RouteDetailPage() {
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
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

  return (
    <div className="space-y-4">
      <Card className="bg-muted/5">
        <CardContent className="space-y-5 pt-5">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Spline className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Route neighbors</CardTitle>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Direct dependencies and dependents</p>
          </div>
        </CardHeader>
        <CardContent className="h-56 p-0">
          <DefinitionGraph
            pipeline={pipeline}
            selectedRouteId={selectedRoute.id}
            onRouteSelect={handleRouteSelect}
            mode="neighbors"
            className="h-56"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y divide-border/60 p-0">
          <DependenciesSection route={selectedRoute} sourceId={sourceId} sourceFileId={sourceFileId} pipelineId={pipelineId} />
          <TransformsSection route={selectedRoute} sourceId={sourceId} sourceFileId={sourceFileId} pipelineId={pipelineId} />
          <OutputsSection route={selectedRoute} sourceId={sourceId} sourceFileId={sourceFileId} pipelineId={pipelineId} />
        </CardContent>
      </Card>
    </div>
  );
}

interface SectionProps {
  route: PipelineDetails["routes"][number];
  sourceId: string;
  sourceFileId: string;
  pipelineId: string;
}

function DependenciesSection({ route, sourceId, sourceFileId, pipelineId }: SectionProps) {
  const artifactDependencies = useMemo(() => {
    return route.depends.filter((dependency) => dependency.type === "artifact");
  }, [route]);

  return (
    <div className="space-y-5 px-6 py-5">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold">Dependencies</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {route.depends.length
          ? route.depends.map((dependency) => (
              dependency.type === "route"
                ? (
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
                  )
                : (
                    <Badge key={`${dependency.type}-${dependency.routeId}-${dependency.artifactName}`} variant="outline">
                      <Package className="h-3 w-3" />
                      artifact:
                      {" "}
                      {dependency.routeId}
                      :
                      {dependency.artifactName}
                    </Badge>
                  )
            ))
          : <span className="text-sm text-muted-foreground">No dependencies.</span>}
      </div>
      {artifactDependencies.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {artifactDependencies.length}
          {" "}
          artifact dependenc
          {artifactDependencies.length === 1 ? "y" : "ies"}
          {" "}
          reference emitted artifacts rather than direct route-to-route edges.
        </div>
      )}

      <div className="space-y-3 border-t border-border/60 pt-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Emits</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {route.emits.length
            ? route.emits.map((emit) => (
                <Badge key={emit.id} variant="secondary">
                  <Package className="h-3 w-3" />
                  {emit.id}
                  {" "}
                  <span className="text-[10px] opacity-70">{emit.scope}</span>
                </Badge>
              ))
            : <span className="text-sm text-muted-foreground">No emitted artifacts.</span>}
        </div>
      </div>
    </div>
  );
}

function TransformsSection({ route, sourceId, sourceFileId, pipelineId }: SectionProps) {
  return (
    <div className="space-y-4 px-6 py-5">
      <div className="flex items-center gap-2">
        <Shuffle className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold">Transforms</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {route.transforms.length
          ? route.transforms.map((transform) => {
              return (
                <Link
                  key={transform}
                  to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms/$transformName"
                  params={{ sourceId, sourceFileId, pipelineId, transformName: transform }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
                >
                  {transform}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              );
            })
          : <span className="text-sm text-muted-foreground">No transforms.</span>}
      </div>
    </div>
  );
}

function OutputsSection({ route, sourceId, sourceFileId, pipelineId }: SectionProps) {
  return (
    <div className="space-y-4 px-6 py-5">
      <div className="flex items-center gap-2">
        <FolderOutput className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold">Outputs</h3>
      </div>
      {route.outputs.length
        ? (
            <div className="grid gap-3">
              {route.outputs.map((output, index) => (
                <div key={`${output.dir ?? "none"}-${output.fileName ?? "none"}-${index}`} className="rounded-lg border border-border/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileOutput className="h-3.5 w-3.5 text-muted-foreground" />
                      Output
                      {" "}
                      {index + 1}
                    </div>
                    <Link
                      to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs/$outputKey"
                      params={{ sourceId, sourceFileId, pipelineId, outputKey: `${route.id}:${index}` }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
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
  );
}

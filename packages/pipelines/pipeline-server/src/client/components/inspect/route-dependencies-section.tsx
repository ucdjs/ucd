import type { PipelineDetails } from "#shared/schemas/pipeline";
import { Link, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Link2, Package, Spline } from "lucide-react";
import { useMemo } from "react";

export interface RouteDependenciesSectionProps {
  route: PipelineDetails["routes"][number];
}

export function RouteDependenciesSection({ route }: RouteDependenciesSectionProps) {
  const { sourceId, sourceFileId, pipelineId } = useParams({ from: "/s/$sourceId/$sourceFileId/$pipelineId" });

  const artifactDependencies = useMemo(() => {
    return route.depends.filter((dependency) => dependency.type === "artifact");
  }, [route]);

  return (
    <Card>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Dependencies</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
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
      </CardContent>
    </Card>
  );
}

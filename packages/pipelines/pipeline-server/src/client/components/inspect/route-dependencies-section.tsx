import type { PipelineDetails } from "#shared/schemas/pipeline";
import { Link, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Link2, Spline } from "lucide-react";

export interface RouteDependenciesSectionProps {
  route: PipelineDetails["routes"][number];
}

export function RouteDependenciesSection({ route }: RouteDependenciesSectionProps) {
  const { sourceId, sourceFileId, pipelineId } = useParams({ from: "/s/$sourceId/$sourceFileId/$pipelineId" });

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
      </CardContent>
    </Card>
  );
}

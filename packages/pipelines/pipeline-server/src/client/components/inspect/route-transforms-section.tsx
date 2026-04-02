import type { PipelineDetails } from "#shared/schemas/pipeline";
import { Link, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/components";
import { ArrowRight, Shuffle } from "lucide-react";

export interface RouteTransformsSectionProps {
  route: PipelineDetails["routes"][number];
}

export function RouteTransformsSection({ route }: RouteTransformsSectionProps) {
  const { sourceId, sourceFileId, pipelineId } = useParams({ from: "/s/$sourceId/$sourceFileId/$pipelineId" });

  return (
    <Card>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Shuffle className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Transforms</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
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
      </CardContent>
    </Card>
  );
}

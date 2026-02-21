import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

export const Route = createLazyFileRoute("/(app)/v/$version/grapheme-visualizer")({
  component: GraphemeVisualizerVersion,
});

function GraphemeVisualizerVersion() {
  const params = Route.useParams();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex flex-1 flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Grapheme & ZWJ Visualizer —
              {" "}
              {params.version}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Break text into grapheme clusters for Unicode
              {" "}
              {params.version}
              , show component parts of ZWJ sequences (emoji parts, modifiers) and describe cluster boundaries.
            </p>
            <Button nativeButton={false} render={<Link to="/v/$version" params={{ version: params.version }}>Back to version</Link>} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
